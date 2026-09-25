import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getSessionWorkspaceId } from "@/lib/supabase/server";

const GRAPH_VERSION = "v19.0";

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

// Meta's Business Discovery field is the one real, officially-supported way
// to look up an ARBITRARY public IG Business/Creator account's name and
// follower count (unlike hashtag search, which deliberately hides authors).
export async function GET(request: NextRequest) {
  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const username = request.nextUrl.searchParams.get("username");
  if (!username) return NextResponse.json({ error: "username is required" }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { data: settings } = await supabase
    .from("workspace_settings")
    .select("instagram")
    .eq("workspace_id", session.workspaceId)
    .maybeSingle();

  const ig = settings?.instagram;
  if (!ig?.connected || !ig?.igUserId || !ig?.token) {
    return NextResponse.json({ error: "Connect Instagram first." }, { status: 400 });
  }

  try {
    const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${ig.igUserId}`);
    url.searchParams.set("fields", `business_discovery.username(${username}){followers_count,name}`);
    url.searchParams.set("access_token", ig.token);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (!res.ok || data.error) {
      return NextResponse.json({ error: data.error?.message || "Lookup failed — the account may not be a public Business/Creator account." }, { status: 400 });
    }

    const discovery = data.business_discovery;
    if (!discovery) {
      return NextResponse.json({ error: "No public business account found for that username." }, { status: 404 });
    }

    return NextResponse.json({
      name: discovery.name || username,
      followersCount: typeof discovery.followers_count === "number" ? formatCount(discovery.followers_count) : "—",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
