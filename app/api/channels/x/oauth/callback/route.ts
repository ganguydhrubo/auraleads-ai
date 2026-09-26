import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getSessionWorkspaceId } from "@/lib/supabase/server";

const REDIRECT_URI = "https://auraleads.online/api/channels/x/oauth/callback";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(new URL(`/app?view=settings&error=${encodeURIComponent(errorParam)}`, request.url));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/app?view=settings&error=missing_code", request.url));
  }

  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.redirect(new URL("/login", request.url));

  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/app?view=settings&error=x_not_configured", request.url));
  }

  const codeVerifier = request.cookies.get("x_oauth_verifier")?.value;
  if (!codeVerifier) {
    return NextResponse.redirect(new URL("/app?view=settings&error=x_session_expired", request.url));
  }

  try {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const form = new URLSearchParams();
    form.set("grant_type", "authorization_code");
    form.set("code", code);
    form.set("redirect_uri", REDIRECT_URI);
    form.set("code_verifier", codeVerifier);
    form.set("client_id", clientId);

    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: form.toString(),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || tokenData.error || "Token exchange failed.");
    }

    const meRes = await fetch("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const meData = await meRes.json();
    if (!meRes.ok || !meData.data?.id) {
      throw new Error(meData.title || meData.detail || "Could not read the connected X account.");
    }

    const supabase = createSupabaseServerClient();
    const { data: current } = await supabase
      .from("workspace_settings")
      .select("x")
      .eq("workspace_id", session.workspaceId)
      .maybeSingle();

    await supabase.from("workspace_settings").upsert({
      workspace_id: session.workspaceId,
      x: {
        ...(current?.x || {}),
        connected: true,
        authMethod: "oauth2",
        handle: meData.data.username,
        userId: meData.data.id,
        oauth2AccessToken: tokenData.access_token,
        oauth2RefreshToken: tokenData.refresh_token,
        oauth2ExpiresAt: new Date(Date.now() + (tokenData.expires_in || 7200) * 1000).toISOString(),
      },
    });

    const response = NextResponse.redirect(new URL("/app?view=settings&x=connected", request.url));
    response.cookies.delete("x_oauth_verifier");
    return response;
  } catch (err: any) {
    console.error("[x/oauth/callback] failed:", err.message);
    const response = NextResponse.redirect(new URL(`/app?view=settings&error=${encodeURIComponent(err.message)}`, request.url));
    response.cookies.delete("x_oauth_verifier");
    return response;
  }
}
