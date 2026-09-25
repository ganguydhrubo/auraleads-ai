import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getSessionWorkspaceId } from "@/lib/supabase/server";

const GRAPH_VERSION = "v19.0";

// Real send via Meta's Send API — only works within the messaging window
// (i.e. replying to someone who has messaged you), which is the one form of
// Instagram messaging automation Meta actually supports for businesses.
export async function POST(request: NextRequest) {
  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { conversationId, text } = await request.json();
  if (!conversationId || !text) return NextResponse.json({ error: "conversationId and text are required" }, { status: 400 });

  const supabase = createSupabaseServerClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("workspace_id", session.workspaceId)
    .maybeSingle();

  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  if (conversation.channel !== "instagram") return NextResponse.json({ error: "This route only sends Instagram messages" }, { status: 400 });

  const senderPsid = conversation.metadata?.senderPsid;
  if (!senderPsid) {
    return NextResponse.json({ error: "No Instagram PSID on this conversation — can't send outside an inbound-message context." }, { status: 400 });
  }

  const { data: settings } = await supabase
    .from("workspace_settings")
    .select("instagram")
    .eq("workspace_id", session.workspaceId)
    .maybeSingle();

  const token = settings?.instagram?.token;
  if (!token) return NextResponse.json({ error: "Instagram is not connected for this workspace." }, { status: 400 });

  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/me/messages?access_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: senderPsid },
        message: { text },
        messaging_type: "RESPONSE",
      }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      return NextResponse.json({ error: data.error?.message || "Send failed" }, { status: 400 });
    }

    await supabase.from("messages").insert({
      workspace_id: session.workspaceId,
      conversation_id: conversationId,
      sender: "me",
      channel: "instagram",
      content: text,
    });
    await supabase.from("conversations").update({ last_active: new Date().toISOString() }).eq("id", conversationId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
