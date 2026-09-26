import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createSupabaseServerClient, createSupabaseAdminClient, getSessionWorkspaceId } from "@/lib/supabase/server";
import { decryptSecret } from "@/lib/crypto";

// Real send via Gmail SMTP (App Password), matching the conversationId-based
// shape of the WhatsApp/Instagram reply routes so the Unified Inbox can call
// all three the same way.
export async function POST(request: NextRequest) {
  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { conversationId, text } = await request.json();
  if (!conversationId || !text) {
    return NextResponse.json({ error: "conversationId and text are required" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("workspace_id", session.workspaceId)
    .maybeSingle();

  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  if (conversation.channel !== "email") return NextResponse.json({ error: "This route only sends email" }, { status: 400 });

  const { data: settings } = await supabase
    .from("workspace_settings")
    .select("gmail")
    .eq("workspace_id", session.workspaceId)
    .maybeSingle();

  const accounts: { email: string; connected: boolean; dailySent: number }[] = settings?.gmail?.accounts || [];
  if (accounts.length === 0) {
    return NextResponse.json({ error: "No Gmail account connected for this workspace." }, { status: 400 });
  }

  // Round-robin: use whichever connected account has sent the least today,
  // rather than a fixed single account, so volume actually spreads out.
  const fromAccount = [...accounts].sort((a, b) => (a.dailySent || 0) - (b.dailySent || 0))[0];

  const admin = createSupabaseAdminClient();
  const { data: secret, error: secretErr } = await admin
    .from("gmail_secrets")
    .select("encrypted_app_password")
    .eq("workspace_id", session.workspaceId)
    .eq("email", fromAccount.email)
    .maybeSingle();

  if (secretErr || !secret) {
    return NextResponse.json({ error: `No stored credentials for ${fromAccount.email}. Reconnect it in Settings.` }, { status: 400 });
  }

  const appPassword = decryptSecret(secret.encrypted_app_password);
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: fromAccount.email, pass: appPassword },
  });

  const subject = conversation.metadata?.subject || `Re: your message`;
  let info;
  try {
    info = await transporter.sendMail({
      from: fromAccount.email,
      to: conversation.contact_handle,
      subject,
      text,
      ...(conversation.metadata?.lastMessageId ? { inReplyTo: conversation.metadata.lastMessageId, references: conversation.metadata.lastMessageId } : {}),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to send email." }, { status: 502 });
  }

  await supabase.from("messages").insert({
    workspace_id: session.workspaceId,
    conversation_id: conversationId,
    sender: "me",
    channel: "email",
    content: text,
    external_id: info.messageId,
  });
  await supabase.from("conversations").update({ last_active: new Date().toISOString() }).eq("id", conversationId);

  const updatedAccounts = accounts.map((a) =>
    a.email === fromAccount.email ? { ...a, dailySent: (a.dailySent || 0) + 1 } : a
  );
  await supabase.from("workspace_settings").upsert({ workspace_id: session.workspaceId, gmail: { accounts: updatedAccounts } });

  return NextResponse.json({ success: true, sentFrom: fromAccount.email });
}
