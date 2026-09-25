import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient, getSessionWorkspaceId } from "@/lib/supabase/server";
import { encryptSecret } from "@/lib/crypto";

// Saves the workspace's own logged-in LinkedIn/Instagram browser session
// (a single cookie value the user copies from their own browser's devtools
// after logging in normally) so the automation worker can act as them.
// The raw cookie is encrypted at rest and never sent back to the browser.
export async function POST(request: NextRequest) {
  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { platform, sessionCookie, label } = await request.json();
  if (!["linkedin", "instagram"].includes(platform)) {
    return NextResponse.json({ error: "platform must be linkedin or instagram" }, { status: 400 });
  }
  if (!sessionCookie || typeof sessionCookie !== "string" || sessionCookie.length < 10) {
    return NextResponse.json({ error: "sessionCookie looks invalid" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const encrypted = encryptSecret(sessionCookie);

  const { error: sessErr } = await admin
    .from("automation_sessions")
    .upsert({ workspace_id: session.workspaceId, platform, encrypted_session: encrypted, label: label || null, updated_at: new Date().toISOString() });

  if (sessErr) return NextResponse.json({ error: sessErr.message }, { status: 500 });

  // Reflect connection status in workspace_settings (readable by the client).
  const supabase = createSupabaseServerClient();
  const { data: current } = await supabase
    .from("workspace_settings")
    .select("linkedin, instagram")
    .eq("workspace_id", session.workspaceId)
    .maybeSingle();

  if (platform === "linkedin") {
    await supabase.from("workspace_settings").upsert({
      workspace_id: session.workspaceId,
      linkedin: { ...(current?.linkedin || {}), connected: true, accountLabel: label || "My LinkedIn", sessionSavedAt: new Date().toISOString(), dailyConnectionLimit: current?.linkedin?.dailyConnectionLimit || 20, dailyMessageLimit: current?.linkedin?.dailyMessageLimit || 30 },
    });
  } else {
    await supabase.from("workspace_settings").upsert({
      workspace_id: session.workspaceId,
      instagram: { ...(current?.instagram || {}), sessionConnected: true, sessionLabel: label || "My Instagram", sessionSavedAt: new Date().toISOString() },
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const platform = request.nextUrl.searchParams.get("platform");
  if (!platform) return NextResponse.json({ error: "platform is required" }, { status: 400 });

  const admin = createSupabaseAdminClient();
  await admin.from("automation_sessions").delete().eq("workspace_id", session.workspaceId).eq("platform", platform);

  const supabase = createSupabaseServerClient();
  const { data: current } = await supabase
    .from("workspace_settings")
    .select("linkedin, instagram")
    .eq("workspace_id", session.workspaceId)
    .maybeSingle();

  if (platform === "linkedin") {
    await supabase.from("workspace_settings").upsert({ workspace_id: session.workspaceId, linkedin: { ...(current?.linkedin || {}), connected: false } });
  } else {
    await supabase.from("workspace_settings").upsert({ workspace_id: session.workspaceId, instagram: { ...(current?.instagram || {}), sessionConnected: false } });
  }

  return NextResponse.json({ success: true });
}
