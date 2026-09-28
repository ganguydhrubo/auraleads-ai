import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getSessionWorkspaceId } from "@/lib/supabase/server";
import { getWorkerAvailability } from "@/lib/automation/worker-status";

const PLATFORM_ACTIONS: Record<string, string[]> = {
  linkedin: ["search", "view_profile", "connect", "message"],
  instagram: ["search", "view_profile", "connect", "message"],
  // Email/X have real send APIs, not browser automation — there's no
  // "search"/"connect" step to queue for them, only the outbound send.
  email: ["message"],
  x: ["message"],
};

// Browser-automation channels only run on a laptop/persistent-host worker —
// GitHub Actions IPs get flagged by both platforms, so there is never a
// "scheduled" node for these, only "live".
const LAPTOP_ONLY_CHANNELS = new Set(["linkedin", "instagram"]);

// Enqueues a job for the shared social-worker (see /workers/social-worker).
// LinkedIn/Instagram have no official API for cold discovery or outbound
// DMs, so those drive a headless browser using the workspace's own logged-in
// session (automation_sessions). Email/X have real send APIs and no browser
// involved, but still go through this same queue+worker so they can run on
// a free scheduled runner instead of needing a paid host or the customer's
// browser tab to stay open.
export async function POST(request: NextRequest) {
  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { platform, action, payload } = await request.json();
  if (!Object.keys(PLATFORM_ACTIONS).includes(platform)) {
    return NextResponse.json({ error: "platform must be linkedin, instagram, email, or x" }, { status: 400 });
  }
  if (!PLATFORM_ACTIONS[platform].includes(action)) {
    return NextResponse.json({ error: `invalid action for ${platform}` }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  // Refuse to enqueue if there's no saved session/connection for this
  // channel yet — gives a clear error instead of a job that fails silently
  // on the worker.
  const { data: settings } = await supabase
    .from("workspace_settings")
    .select("linkedin, instagram, gmail, x")
    .eq("workspace_id", session.workspaceId)
    .maybeSingle();

  const connected =
    platform === "linkedin" ? settings?.linkedin?.connected :
    platform === "instagram" ? settings?.instagram?.sessionConnected :
    platform === "email" ? (settings?.gmail?.accounts?.length ?? 0) > 0 :
    settings?.x?.connected;
  if (!connected) {
    const setting = platform === "email" ? "Gmail" : platform === "x" ? "X" : platform;
    return NextResponse.json(
      { error: `Connect your ${setting} account in Settings before running automation jobs.` },
      { status: 400 }
    );
  }

  // Don't claim a job is "queued" if nothing is actually online (or due to
  // run again soon) to process it — that's exactly what silently rots in
  // automation_jobs as status=queued forever.
  const availability = await getWorkerAvailability(supabase, platform);
  if (!availability.available) {
    const message = LAPTOP_ONLY_CHANNELS.has(platform)
      ? `${platform === "instagram" ? "Instagram" : "LinkedIn"} needs the laptop worker running. Start the social-worker process (see Admin → Worker Nodes) and try again.`
      : "No automation worker is currently online or scheduled to run this job. Start the social-worker process, or check that the scheduled GitHub Action is enabled, and try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("automation_jobs")
    .insert({ workspace_id: session.workspaceId, platform, action, payload: payload || {} })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    job: data,
    queuedVia: availability.via,
    ...(availability.via === "scheduled" ? { etaMinutes: availability.etaMinutes } : {}),
  });
}

export async function GET(request: NextRequest) {
  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const platform = request.nextUrl.searchParams.get("platform");
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("automation_jobs")
    .select("*")
    .eq("workspace_id", session.workspaceId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (platform) query = query.eq("platform", platform);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ jobs: data });
}
