import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getSessionWorkspaceId } from "@/lib/supabase/server";

const REDIRECT_URI = "https://auraleads.online/api/channels/instagram/oauth/callback";

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

  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  if (!appId || !appSecret) {
    return NextResponse.redirect(new URL("/app?view=settings&error=instagram_not_configured", request.url));
  }

  try {
    // Step 1: exchange the authorization code for a short-lived token.
    // Instagram API with Instagram Login uses api.instagram.com for this,
    // not graph.facebook.com — a different host than the classic Facebook
    // Login for Business flow.
    const form = new URLSearchParams();
    form.set("client_id", appId);
    form.set("client_secret", appSecret);
    form.set("grant_type", "authorization_code");
    form.set("redirect_uri", REDIRECT_URI);
    form.set("code", code);

    const shortRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const shortData = await shortRes.json();
    if (!shortRes.ok || !shortData.access_token) {
      throw new Error(shortData.error_message || shortData.error?.message || "Short-lived token exchange failed.");
    }

    const igUserId = String(shortData.user_id);

    // Step 2: exchange the short-lived token for a long-lived one (60 days,
    // refreshable) via graph.instagram.com.
    const longUrl = new URL("https://graph.instagram.com/access_token");
    longUrl.searchParams.set("grant_type", "ig_exchange_token");
    longUrl.searchParams.set("client_secret", appSecret);
    longUrl.searchParams.set("access_token", shortData.access_token);

    const longRes = await fetch(longUrl.toString());
    const longData = await longRes.json();
    if (!longRes.ok || !longData.access_token) {
      throw new Error(longData.error?.message || "Long-lived token exchange failed.");
    }

    // Step 3: get the real Instagram username for a friendly confirmation.
    let username = "";
    try {
      const meRes = await fetch(
        `https://graph.instagram.com/v21.0/${igUserId}?fields=username&access_token=${encodeURIComponent(longData.access_token)}`
      );
      const meData = await meRes.json();
      username = meData.username || "";
    } catch {
      // non-fatal — connection still succeeded without a display name
    }

    const supabase = createSupabaseServerClient();
    const { data: current } = await supabase
      .from("workspace_settings")
      .select("instagram")
      .eq("workspace_id", session.workspaceId)
      .maybeSingle();

    await supabase.from("workspace_settings").upsert({
      workspace_id: session.workspaceId,
      instagram: {
        ...(current?.instagram || {}),
        connected: true,
        authMethod: "instagram_login",
        igUserId,
        username,
        token: longData.access_token,
        tokenExpiresAt: new Date(Date.now() + (longData.expires_in || 5184000) * 1000).toISOString(),
        webhookConfigured: true,
        verifyToken: process.env.META_VERIFY_TOKEN || "auraleads_wh_token",
      },
    });

    return NextResponse.redirect(new URL("/app?view=settings&instagram=connected", request.url));
  } catch (err: any) {
    console.error("[instagram/oauth/callback] failed:", err.message);
    return NextResponse.redirect(new URL(`/app?view=settings&error=${encodeURIComponent(err.message)}`, request.url));
  }
}
