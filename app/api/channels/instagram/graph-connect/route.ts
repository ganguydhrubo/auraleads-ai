import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getSessionWorkspaceId } from "@/lib/supabase/server";

const GRAPH_VERSION = "v19.0";

async function graphGet(path: string, params: Record<string, string>) {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || `Graph API request to ${path} failed`);
  }
  return data;
}

// Real BYO-credentials connect: the user pastes a long-lived Page Access
// Token they generated themselves (Graph API Explorer / their own Meta app
// setup) — no OAuth redirect dance here, matching the rest of this app's
// BYO-integration pattern.
export async function POST(request: NextRequest) {
  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { appId, appSecret, token } = await request.json();
  if (!token) return NextResponse.json({ error: "token is required" }, { status: 400 });

  let igUserId: string | null = null;
  let username: string | undefined;

  try {
    const pages = await graphGet("me/accounts", { access_token: token });
    const pageList: any[] = pages.data || [];

    for (const page of pageList) {
      try {
        const pageDetail = await graphGet(page.id, {
          fields: "instagram_business_account,name",
          access_token: token,
        });
        if (pageDetail.instagram_business_account?.id) {
          igUserId = pageDetail.instagram_business_account.id;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!igUserId) {
      return NextResponse.json(
        { error: "No Instagram Business Account is connected to this token's Pages. Connect an IG Business account to a Facebook Page first." },
        { status: 400 }
      );
    }

    try {
      const igDetail = await graphGet(igUserId, { fields: "username", access_token: token });
      username = igDetail.username;
    } catch {
      // Non-fatal — connection still succeeds without the display username.
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { data: current } = await supabase
    .from("workspace_settings")
    .select("instagram")
    .eq("workspace_id", session.workspaceId)
    .maybeSingle();

  const { error: upsertError } = await supabase.from("workspace_settings").upsert({
    workspace_id: session.workspaceId,
    instagram: {
      ...(current?.instagram || {}),
      connected: true,
      appId,
      appSecret,
      token,
      igUserId,
      webhookConfigured: true,
      verifyToken: process.env.META_VERIFY_TOKEN || "auraleads_wh_token",
    },
  });

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });

  return NextResponse.json({ success: true, igUserId, username });
}
