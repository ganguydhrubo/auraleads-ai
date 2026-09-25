import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getSessionWorkspaceId } from "@/lib/supabase/server";

interface AiReplyResult {
  reply: string;
  shouldReply: boolean;
  needsHuman: boolean;
}

async function draftReply(businessDefinition: string, postReplyInstruction: string, stopCriteria: string, handoffCriteria: string, history: { sender: string; content: string }[]): Promise<AiReplyResult | null> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return null;

  const transcript = history.map((m) => `${m.sender === "me" ? "Us" : m.sender === "ai" ? "AI" : "Them"}: ${m.content}`).join("\n");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content:
            `You are the AI assistant replying on behalf of this business: "${businessDefinition}". ` +
            `Reply instructions: "${postReplyInstruction}". ` +
            `Stop messaging if: "${stopCriteria}". ` +
            `Hand off to a human if: "${handoffCriteria}". ` +
            `Output ONLY valid JSON with keys: reply (string, a short natural reply), shouldReply (boolean, false if the stop criteria applies), needsHuman (boolean, true if the handoff criteria applies). No markdown backticks.`,
        },
        { role: "user", content: `Conversation so far:\n${transcript}\n\nDraft the next reply.` },
      ],
      temperature: 0.5,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim() || "";
  const clean = raw.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    const parsed = JSON.parse(clean);
    return {
      reply: parsed.reply || "",
      shouldReply: parsed.shouldReply !== false,
      needsHuman: !!parsed.needsHuman,
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { conversationId } = await request.json();
  if (!conversationId) return NextResponse.json({ error: "conversationId is required" }, { status: 400 });

  const supabase = createSupabaseServerClient();

  const [{ data: conversation }, { data: rules }, { data: messages }] = await Promise.all([
    supabase.from("conversations").select("*").eq("id", conversationId).eq("workspace_id", session.workspaceId).maybeSingle(),
    supabase.from("ai_reply_rules").select("*").eq("workspace_id", session.workspaceId).maybeSingle(),
    supabase.from("messages").select("sender, content").eq("conversation_id", conversationId).order("created_at", { ascending: true }).limit(10),
  ]);

  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  if (!rules?.post_reply_instruction) {
    return NextResponse.json({ skipped: true, reason: "No AI reply rules configured." });
  }

  const result = await draftReply(
    rules.business_definition || "",
    rules.post_reply_instruction || "",
    rules.stop_messaging_criteria || "",
    rules.human_handoff_criteria || "",
    messages || []
  );

  if (!result) {
    return NextResponse.json({ error: "GROQ_API_KEY not set or draft generation failed" }, { status: 500 });
  }

  if (!result.shouldReply) {
    return NextResponse.json({ success: true, replied: false, reason: "Stop-messaging criteria matched." });
  }

  if (result.needsHuman) {
    await supabase.from("conversations").update({ needs_human: true }).eq("id", conversationId);
    await supabase.from("messages").insert({
      workspace_id: session.workspaceId,
      conversation_id: conversationId,
      sender: "ai",
      channel: conversation.channel,
      content: result.reply,
    });
    return NextResponse.json({ success: true, replied: false, reason: "Needs human handoff — drafted, not sent." });
  }

  const cookieHeader = request.headers.get("cookie") || "";
  let dispatched = false;

  if (conversation.channel === "instagram") {
    try {
      const sendRes = await fetch(new URL("/api/channels/instagram/send", request.nextUrl.origin), {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: cookieHeader },
        body: JSON.stringify({ conversationId, text: result.reply }),
      });
      dispatched = sendRes.ok;
    } catch (err) {
      console.error("[ai-reply] instagram dispatch failed:", err);
    }
  } else if (conversation.channel === "whatsapp") {
    try {
      const sendRes = await fetch(new URL("/api/channels/whatsapp/send", request.nextUrl.origin), {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: cookieHeader },
        body: JSON.stringify({ conversationId, text: result.reply }),
      });
      dispatched = sendRes.ok;
    } catch (err) {
      // whatsapp/send may not exist yet if that work isn't done — degrade gracefully
      console.error("[ai-reply] whatsapp dispatch failed or route not ready:", err);
    }
  }

  if (!dispatched) {
    await supabase.from("messages").insert({
      workspace_id: session.workspaceId,
      conversation_id: conversationId,
      sender: "ai",
      channel: conversation.channel,
      content: result.reply,
    });
  }

  return NextResponse.json({ success: true, replied: dispatched });
}
