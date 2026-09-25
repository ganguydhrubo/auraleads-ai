import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getSessionWorkspaceId } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { conversationId, text } = await request.json();
  if (!conversationId || !text) {
    return NextResponse.json({ error: "conversationId and text are required" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  const { data: conversation } = await supabase.from("conversations").select("*").eq("id", conversationId).eq("workspace_id", session.workspaceId).single();
  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  if (conversation.channel !== "whatsapp") return NextResponse.json({ error: "Not a WhatsApp conversation" }, { status: 400 });

  const { data: settings } = await supabase
    .from("workspace_settings")
    .select("whatsapp")
    .eq("workspace_id", session.workspaceId)
    .maybeSingle();

  const wa = settings?.whatsapp;
  if (!wa?.connected || !wa?.phoneNumberId || !wa?.accessToken) {
    return NextResponse.json({ error: "WhatsApp is not connected. Verify your credentials in Settings first." }, { status: 400 });
  }

  const to = conversation.contact_handle.replace(/[^\d]/g, "");

  // Meta only allows free-form text within a 24h customer-service window after
  // the last inbound message; outside it, a pre-approved template is required
  // (not implemented here — that's a real WhatsApp platform limit, not a gap
  // to paper over with a fake success).
  let waRes: Response;
  try {
    waRes = await fetch(`https://graph.facebook.com/v19.0/${encodeURIComponent(wa.phoneNumberId)}/messages?access_token=${encodeURIComponent(wa.accessToken)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
    });
  } catch (err: any) {
    return NextResponse.json({ error: `Could not reach WhatsApp Cloud API: ${err.message}` }, { status: 502 });
  }

  const waData = await waRes.json();
  if (!waRes.ok) {
    return NextResponse.json({ error: waData?.error?.message || "WhatsApp send failed (likely outside the 24h reply window — a template message is required)." }, { status: 400 });
  }

  await supabase.from("messages").insert({
    workspace_id: session.workspaceId,
    conversation_id: conversationId,
    sender: "me",
    channel: "whatsapp",
    content: text,
    external_id: waData?.messages?.[0]?.id,
  });
  await supabase.from("conversations").update({ last_active: new Date().toISOString() }).eq("id", conversationId);

  return NextResponse.json({ success: true });
}
