import { SupabaseClient } from "@supabase/supabase-js";

// Fails OPEN (allows the request) if the rate-limit infrastructure itself
// errors — a monitoring/cost-control feature glitching shouldn't take down
// real product functionality. Logged so it's visible, not silent.
export async function checkRateLimit(
  supabase: SupabaseClient,
  workspaceId: string,
  bucketKey: string,
  opts: { max: number; windowSeconds: number }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const windowMs = opts.windowSeconds * 1000;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs).toISOString();

  const { data, error } = await supabase.rpc("increment_rate_limit", {
    p_workspace_id: workspaceId,
    p_bucket_key: bucketKey,
    p_window_start: windowStart,
  });

  if (error) {
    console.error(`[rate-limit] increment failed for ${bucketKey}:`, error.message);
    return { ok: true };
  }

  if ((data as number) > opts.max) {
    return { ok: false, error: "Too many requests — please slow down and try again shortly." };
  }
  return { ok: true };
}
