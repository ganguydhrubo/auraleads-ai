import { SupabaseClient } from "@supabase/supabase-js";

// X OAuth 2.0 user-context access tokens live for ~2 hours; the
// offline.access scope grants a refresh_token so a connected account keeps
// working indefinitely without the customer reconnecting. X rotates the
// refresh_token on every use — the old one stops working, so the new one
// must be saved back immediately or the NEXT refresh will fail.
const EXPIRY_BUFFER_MS = 5 * 60 * 1000;

export async function getValidXAccessToken(supabase: SupabaseClient, workspaceId: string): Promise<string | null> {
  const { data: settings } = await supabase
    .from("workspace_settings")
    .select("x")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  const x = settings?.x;
  if (!x?.connected || x.authMethod !== "oauth2" || !x.oauth2AccessToken) return null;

  const expiresAt = x.oauth2ExpiresAt ? new Date(x.oauth2ExpiresAt).getTime() : 0;
  if (Date.now() < expiresAt - EXPIRY_BUFFER_MS) return x.oauth2AccessToken;

  if (!x.oauth2RefreshToken) return null;

  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const form = new URLSearchParams();
  form.set("grant_type", "refresh_token");
  form.set("refresh_token", x.oauth2RefreshToken);
  form.set("client_id", clientId);

  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: form.toString(),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) return null;

  await supabase.from("workspace_settings").upsert({
    workspace_id: workspaceId,
    x: {
      ...x,
      oauth2AccessToken: data.access_token,
      oauth2RefreshToken: data.refresh_token || x.oauth2RefreshToken,
      oauth2ExpiresAt: new Date(Date.now() + (data.expires_in || 7200) * 1000).toISOString(),
    },
  });

  return data.access_token;
}
