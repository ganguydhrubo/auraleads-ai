import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createSupabaseServerClient, createSupabaseAdminClient, getSessionWorkspaceId } from "@/lib/supabase/server";
import { encryptSecret } from "@/lib/crypto";

export async function POST(request: NextRequest) {
  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { email, appPassword } = await request.json();
  if (!email || !appPassword) {
    return NextResponse.json({ error: "email and appPassword are required" }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: email, pass: appPassword },
  });

  try {
    await transporter.verify();
  } catch {
    return NextResponse.json({ error: "Could not log in — check the email and App Password." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const encrypted = encryptSecret(appPassword);
  const { error: secretErr } = await admin
    .from("gmail_secrets")
    .upsert({ workspace_id: session.workspaceId, email, encrypted_app_password: encrypted });

  if (secretErr) return NextResponse.json({ error: secretErr.message }, { status: 500 });

  const supabase = createSupabaseServerClient();
  const { data: current } = await supabase
    .from("workspace_settings")
    .select("gmail")
    .eq("workspace_id", session.workspaceId)
    .maybeSingle();

  const accounts = (current?.gmail?.accounts || []).filter((a: any) => a.email !== email);
  accounts.push({ email, connected: true, type: "app_password", dailySent: 0 });

  const { error: settingsErr } = await supabase
    .from("workspace_settings")
    .upsert({ workspace_id: session.workspaceId, gmail: { accounts } });

  if (settingsErr) return NextResponse.json({ error: settingsErr.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
