import { NextRequest, NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";
import { createSupabaseServerClient, getSessionWorkspaceId } from "@/lib/supabase/server";

// OAuth 1.0a user-context credentials the workspace owner generates themselves
// from developer.x.com's "Keys and Tokens" page for their own account — no
// OAuth redirect dance needed since it's always their own X account.
export async function POST(request: NextRequest) {
  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { appKey, appSecret, accessToken, accessSecret } = await request.json();
  if (!appKey || !appSecret || !accessToken || !accessSecret) {
    return NextResponse.json({ error: "appKey, appSecret, accessToken and accessSecret are all required" }, { status: 400 });
  }

  let handle: string;
  try {
    const client = new TwitterApi({ appKey, appSecret, accessToken, accessSecret });
    const me = await client.v2.me();
    handle = me.data.username;
  } catch (err: any) {
    return NextResponse.json({ error: err?.data?.detail || err?.message || "Could not verify these X API credentials." }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { data: current } = await supabase
    .from("workspace_settings")
    .select("x")
    .eq("workspace_id", session.workspaceId)
    .maybeSingle();

  const { error: upsertError } = await supabase.from("workspace_settings").upsert({
    workspace_id: session.workspaceId,
    x: { ...(current?.x || {}), connected: true, handle, appKey, appSecret, accessToken, accessSecret },
  });

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });

  return NextResponse.json({ success: true, handle });
}
