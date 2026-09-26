import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { getSessionWorkspaceId } from "@/lib/supabase/server";

// Real "Connect with X" button target — OAuth 2.0 Authorization Code flow
// with PKCE (X requires PKCE even for confidential clients). No official
// scope grants DM access without the user explicitly approving it here.
const REDIRECT_URI = "https://auraleads.online/api/channels/x/oauth/callback";
const SCOPES = "tweet.read tweet.write users.read dm.read dm.write offline.access";

function base64url(input: Buffer): string {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function GET(request: NextRequest) {
  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.redirect(new URL("/login", request.url));

  const clientId = process.env.X_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/app?view=settings&error=x_not_configured", request.url));
  }

  const codeVerifier = base64url(randomBytes(32));
  const codeChallenge = base64url(createHash("sha256").update(codeVerifier).digest());

  const authorizeUrl = new URL("https://x.com/i/oauth2/authorize");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authorizeUrl.searchParams.set("scope", SCOPES);
  authorizeUrl.searchParams.set("state", session.workspaceId);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authorizeUrl.toString());
  // The verifier only has to survive this one redirect round-trip — short
  // TTL, httpOnly so client JS (and thus XSS) can't read it.
  response.cookies.set("x_oauth_verifier", codeVerifier, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/api/channels/x/oauth",
  });

  return response;
}
