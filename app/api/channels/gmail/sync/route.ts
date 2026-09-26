import { NextRequest, NextResponse } from "next/server";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { createSupabaseServerClient, createSupabaseAdminClient, getSessionWorkspaceId } from "@/lib/supabase/server";
import { decryptSecret } from "@/lib/crypto";

// IMAP fetch+parse per message is slow enough that scanning a busy inbox
// could exceed a serverless function's time limit; cap it so a sync always
// finishes within one request instead of timing out silently.
export const maxDuration = 60;
const MAX_MESSAGES_PER_ACCOUNT = 25;

// Pull-based sync, not a background job — Gmail App Passwords have no push/
// webhook mechanism (that requires full OAuth + Google Pub/Sub, out of scope
// for this auth method), so this is triggered on demand from the Inbox/
// Settings UI and fetches whatever arrived since the last sync.
export async function POST(request: NextRequest) {
  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const supabase = createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  const { data: settings } = await supabase
    .from("workspace_settings")
    .select("gmail")
    .eq("workspace_id", session.workspaceId)
    .maybeSingle();

  const accounts: { email: string }[] = settings?.gmail?.accounts || [];
  if (accounts.length === 0) {
    return NextResponse.json({ error: "No Gmail account connected for this workspace." }, { status: 400 });
  }

  let totalNew = 0;
  const errors: string[] = [];

  for (const account of accounts) {
    const { data: secret } = await admin
      .from("gmail_secrets")
      .select("encrypted_app_password")
      .eq("workspace_id", session.workspaceId)
      .eq("email", account.email)
      .maybeSingle();

    if (!secret) {
      errors.push(`${account.email}: no stored credentials.`);
      continue;
    }

    const appPassword = decryptSecret(secret.encrypted_app_password);
    const client = new ImapFlow({
      host: "imap.gmail.com",
      port: 993,
      secure: true,
      auth: { user: account.email, pass: appPassword },
      logger: false,
    });

    try {
      await client.connect();
      const lock = await client.getMailboxLock("INBOX");
      try {
        // Last 3 days only — this is an on-demand check, not a full mailbox
        // import, and keeps each sync fast.
        const since = new Date();
        since.setDate(since.getDate() - 3);
        const allUids = (await client.search({ since })) || [];
        // Most recent first, capped — this is an on-demand check, not a full
        // mailbox import.
        const uids = [...allUids].sort((a, b) => b - a).slice(0, MAX_MESSAGES_PER_ACCOUNT);

        for (const uid of uids) {
          const msg = await client.fetchOne(uid, { source: true, envelope: true });
          if (!msg || !msg.source) continue;

          const parsed = await simpleParser(msg.source);
          const messageId = parsed.messageId || `imap-${account.email}-${uid}`;
          const fromAddress = parsed.from?.value?.[0]?.address;
          const fromName = parsed.from?.value?.[0]?.name || fromAddress;
          if (!fromAddress) continue;

          // Skip mail this same connected account sent — we already record
          // those from the send route, and don't want to re-import our own
          // outbound messages as inbound replies.
          if (fromAddress.toLowerCase() === account.email.toLowerCase()) continue;

          const { data: existingMsg } = await supabase
            .from("messages")
            .select("id")
            .eq("workspace_id", session.workspaceId)
            .eq("external_id", messageId)
            .maybeSingle();
          if (existingMsg) continue;

          let { data: conversation } = await supabase
            .from("conversations")
            .select("id")
            .eq("workspace_id", session.workspaceId)
            .eq("channel", "email")
            .eq("contact_handle", fromAddress)
            .maybeSingle();

          if (!conversation) {
            const { data: created } = await supabase
              .from("conversations")
              .insert({
                workspace_id: session.workspaceId,
                channel: "email",
                contact_name: fromName,
                contact_handle: fromAddress,
                contact_type: "lead",
                metadata: { subject: parsed.subject, lastMessageId: messageId },
              })
              .select()
              .single();
            conversation = created;
          } else {
            await supabase
              .from("conversations")
              .update({ metadata: { subject: parsed.subject, lastMessageId: messageId } })
              .eq("id", conversation.id);
          }

          if (!conversation) continue;

          await supabase.from("messages").insert({
            workspace_id: session.workspaceId,
            conversation_id: conversation.id,
            sender: "them",
            channel: "email",
            content: parsed.text || parsed.html || "(no readable body)",
            external_id: messageId,
          });
          await supabase.from("conversations").update({ last_active: new Date().toISOString() }).eq("id", conversation.id);
          totalNew += 1;
        }
      } finally {
        lock.release();
      }
      await client.logout();
    } catch (err: any) {
      errors.push(`${account.email}: ${err.message || "IMAP connection failed."}`);
      try {
        await client.logout();
      } catch {}
    }
  }

  return NextResponse.json({ success: errors.length === 0, newMessages: totalNew, errors });
}
