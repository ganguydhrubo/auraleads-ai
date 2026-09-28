import { SupabaseClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { decryptSecret } from "./crypto";
import { upsertConversationAndMessage } from "./conversations";

// Cold (first-touch) email to a lead. There was previously no send path for
// this at all in the app — only a reply-to-an-existing-conversation route
// (app/api/channels/gmail/send) existed. This ports that route's Gmail
// App-Password + round-robin account logic, generalized to start from a
// leadId (creating the conversation if one doesn't exist yet) the same way
// x-send.ts's sendXDm already does for X.
export async function sendColdEmail(supabase: SupabaseClient, workspaceId: string, leadId: string): Promise<void> {
  const { data: lead } = await supabase.from("leads").select("*").eq("id", leadId).eq("workspace_id", workspaceId).single();
  if (!lead) throw new Error("Lead not found.");
  if (!lead.generated_email) throw new Error("This lead has no generated email yet.");
  if (!lead.email) throw new Error("This lead has no email address on file.");

  const { data: settings } = await supabase.from("workspace_settings").select("gmail").eq("workspace_id", workspaceId).maybeSingle();
  const accounts: { email: string; connected: boolean; dailySent: number }[] = settings?.gmail?.accounts || [];
  if (accounts.length === 0) throw new Error("No Gmail account connected for this workspace.");

  // Round-robin: whichever connected account has sent the least today.
  const fromAccount = [...accounts].sort((a, b) => (a.dailySent || 0) - (b.dailySent || 0))[0];

  const { data: secret, error: secretErr } = await supabase
    .from("gmail_secrets")
    .select("encrypted_app_password")
    .eq("workspace_id", workspaceId)
    .eq("email", fromAccount.email)
    .maybeSingle();
  if (secretErr || !secret) throw new Error(`No stored credentials for ${fromAccount.email}. Reconnect it in Settings.`);

  const appPassword = decryptSecret(secret.encrypted_app_password);
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: fromAccount.email, pass: appPassword },
  });

  let info;
  try {
    info = await transporter.sendMail({
      from: fromAccount.email,
      to: lead.email,
      subject: `Quick note for ${lead.name || lead.username}`,
      text: lead.generated_email,
    });
  } catch (err: any) {
    throw new Error(err.message || "Failed to send email.");
  }

  await supabase.from("leads").update({ email_sent: true }).eq("id", leadId);
  await upsertConversationAndMessage(supabase, workspaceId, leadId, "email", lead.name || lead.username, lead.email, lead.generated_email);

  const updatedAccounts = accounts.map((a) => (a.email === fromAccount.email ? { ...a, dailySent: (a.dailySent || 0) + 1 } : a));
  await supabase.from("workspace_settings").upsert({ workspace_id: workspaceId, gmail: { accounts: updatedAccounts } });

  // Only ever log the message id nodemailer returns, never credentials.
  console.log(`[social-worker] email sent, message id ${info.messageId}`);
}
