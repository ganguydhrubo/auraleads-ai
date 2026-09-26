import { NextRequest, NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/supabase/server";

// Real "Connect with Instagram" button target. Uses the Instagram-specific
// App ID (distinct from the parent Meta App ID) issued by Meta's newer
// "Instagram API with Instagram Login" product — this is a genuine OAuth
// redirect, not a pasted token.
const REDIRECT_URI = "https://auraleads.online/api/channels/instagram/oauth/callback";
const SCOPES = "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments";

export async function GET(request: NextRequest) {
  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.redirect(new URL("/login", request.url));

  const appId = process.env.INSTAGRAM_APP_ID;
  if (!appId) {
    return NextResponse.redirect(new URL("/app?view=settings&error=instagram_not_configured", request.url));
  }

  const authorizeUrl = new URL("https://www.instagram.com/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", appId);
  authorizeUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", SCOPES);
  // Carries the workspace through the redirect so the callback (which runs
  // in the same browser, so has the same session cookie anyway) has a
  // fallback way to identify the workspace if cookies ever don't carry.
  authorizeUrl.searchParams.set("state", session.workspaceId);

  return NextResponse.redirect(authorizeUrl.toString());
}
