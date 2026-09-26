import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getSessionWorkspaceId } from "@/lib/supabase/server";

// Completes Meta's WhatsApp Embedded Signup (the real one-click flow): the
// client runs FB.login() with the Embedded Signup config, gets back a short
// "code" plus phone_number_id/waba_id via postMessage, and hands both to us
// here. We exchange the code for a real access token server-side (the app
// secret can never touch the browser) and store everything.
export async function POST(request: NextRequest) {
  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { code, phoneNumberId, wabaId } = await request.json();
  if (!code || !phoneNumberId || !wabaId) {
    return NextResponse.json({ error: "code, phoneNumberId and wabaId are required" }, { status: 400 });
  }

  const appId = process.env.NEXT_PUBLIC_META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    return NextResponse.json({ error: "WhatsApp Embedded Signup isn't configured on this deployment yet." }, { status: 500 });
  }

  try {
    // Exchange the short-lived code for a long-lived access token using the
    // MAIN Meta App's id/secret — Embedded Signup is tied to the parent app,
    // not the separate Instagram-specific app.
    const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("code", code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error?.message || "Could not exchange the Embedded Signup code for a token.");
    }

    const accessToken = tokenData.access_token;

    // Subscribe our app to this WABA's webhooks so inbound messages flow in.
    await fetch(`https://graph.facebook.com/v21.0/${wabaId}/subscribed_apps?access_token=${encodeURIComponent(accessToken)}`, {
      method: "POST",
    }).catch(() => {});

    // Fetch the real display phone number for a friendly confirmation.
    let displayPhone = "";
    try {
      const phoneRes = await fetch(
        `https://graph.facebook.com/v21.0/${phoneNumberId}?fields=display_phone_number&access_token=${encodeURIComponent(accessToken)}`
      );
      const phoneData = await phoneRes.json();
      displayPhone = phoneData.display_phone_number || "";
    } catch {
      // non-fatal
    }

    const supabase = createSupabaseServerClient();
    const { data: current } = await supabase
      .from("workspace_settings")
      .select("whatsapp")
      .eq("workspace_id", session.workspaceId)
      .maybeSingle();

    await supabase.from("workspace_settings").upsert({
      workspace_id: session.workspaceId,
      whatsapp: {
        ...(current?.whatsapp || {}),
        connected: true,
        connectMethod: "embedded_signup",
        phoneNumberId,
        businessAccountId: wabaId,
        accessToken,
        displayPhone,
        webhookConfigured: true,
        verifyToken: process.env.META_VERIFY_TOKEN || "auraleads_wh_token",
      },
    });

    return NextResponse.json({ success: true, displayPhone });
  } catch (err: any) {
    console.error("[whatsapp/embedded-signup] failed:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
