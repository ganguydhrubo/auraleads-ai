import { SupabaseClient } from "@supabase/supabase-js";

// The social-worker process heartbeats into worker_nodes every poll cycle
// (see workers/social-worker/src/index.ts). A row older than this is either
// a manually-added bookkeeping entry that was never actually started, or a
// worker that crashed/was stopped — either way, nothing will pick up a job.
const STALE_AFTER_MS = 60_000;

export async function hasLiveWorker(supabase: SupabaseClient): Promise<boolean> {
  const cutoff = new Date(Date.now() - STALE_AFTER_MS).toISOString();
  const { count } = await supabase
    .from("worker_nodes")
    .select("id", { count: "exact", head: true })
    .eq("status", "running")
    .gte("last_heartbeat", cutoff);
  return (count || 0) > 0;
}
