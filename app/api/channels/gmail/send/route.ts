import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createSupabaseServerClient, createSupabaseAdminClient, getSessionWorkspaceId } from "@/lib/supabase/server";
import { decryptSecret } from "@/lib/crypto";

export async function POST(request: NextRequest) {
  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { fromEmail, to, subject, text } = await request.json();
  if (!fromEmail || !to || !subject || !text) {
    return NextResponse.json({ error: "fromEmail, to, subject and text are required" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: secret, error: secretErr } = await admin
    .from("gmail_secrets")
    .select("encrypted_app_password")
    .eq("workspace_id", session.workspaceId)
    .eq("email", fromEmail)
    .maybeSingle();

  if (secretErr || !secret) {
    return NextResponse.json({ error: "This Gmail account isn't connected for this workspace." }, { status: 400 });
  }

  const appPassword = decryptSecret(secret.encrypted_app_password);
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: fromEmail, pass: appPassword },
  });

  let info;
  try {
    info = await transporter.sendMail({ from: fromEmail, to, subject, text });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to send email." }, { status: 502 });
  }

  const supabase = createSupabaseServerClient();
  const { data: current } = await supabase
    .from("workspace_settings")
    .select("gmail")
    .eq("workspace_id", session.workspaceId)
    .maybeSingle();

  const accounts = (current?.gmail?.accounts || []).map((a: any) =>
    a.email === fromEmail ? { ...a, dailySent: (a.dailySent || 0) + 1 } : a
  );
  await supabase.from("workspace_settings").upsert({ workspace_id: session.workspaceId, gmail: { accounts } });

  return NextResponse.json({ success: true, messageId: info.messageId });
}
