import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getSessionWorkspaceId } from "@/lib/supabase/server";
import { hasLiveWorker } from "@/lib/automation/worker-status";

// Enqueues a browser-automation job for the shared LinkedIn/Instagram worker
// (see /workers/social-worker). Neither platform has an official API for
// cold discovery or outbound DMs, so this drives a headless browser using
// the workspace's own logged-in session — see automation_sessions.
export async function POST(request: NextRequest) {
  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { platform, action, payload } = await request.json();
  if (!["linkedin", "instagram"].includes(platform)) {
    return NextResponse.json({ error: "platform must be linkedin or instagram" }, { status: 400 });
  }
  if (!["search", "view_profile", "connect", "message"].includes(action)) {
    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  // Refuse to enqueue if there's no saved session for this platform yet —
  // gives a clear error instead of a job that fails silently on the worker.
  const { data: settings } = await supabase
    .from("workspace_settings")
    .select("linkedin, instagram")
    .eq("workspace_id", session.workspaceId)
    .maybeSingle();

  const connected = platform === "linkedin" ? settings?.linkedin?.connected : settings?.instagram?.sessionConnected;
  if (!connected) {
    return NextResponse.json(
      { error: `Connect your ${platform} browser session in Settings before running automation jobs.` },
      { status: 400 }
    );
  }

  // Don't claim a job is "queued" if nothing is actually online to run it —
  // that's exactly what silently rots in automation_jobs as status=queued forever.
  if (!(await hasLiveWorker(supabase))) {
    return NextResponse.json(
      { error: "No automation worker is currently online to run this job. Start the social-worker process (see Admin → Worker Nodes) and try again." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("automation_jobs")
    .insert({ workspace_id: session.workspaceId, platform, action, payload: payload || {} })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ job: data });
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
