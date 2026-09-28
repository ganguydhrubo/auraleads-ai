import { SupabaseClient } from "@supabase/supabase-js";

// The social-worker process heartbeats into worker_nodes every poll cycle
// (see workers/social-worker/src/index.ts). A row older than this is either
// a manually-added bookkeeping entry that was never actually started, or a
// worker that crashed/was stopped — either way, nothing will pick up a job
// right now.
const LIVE_STALE_AFTER_MS = 60_000;
// Used only if a scheduled node hasn't reported its own cadence yet — should
// match the cron in .github/workflows/social-worker.yml.
const DEFAULT_SCHEDULE_INTERVAL_MIN = 30;

export type WorkerAvailability =
  | { available: true; via: "live" }
  | { available: true; via: "scheduled"; etaMinutes: number }
  | { available: false };

// Per-channel replacement for the old binary hasLiveWorker() check. A job
// for `channel` may be queued if EITHER a live node heartbeated recently and
// serves that channel, OR a scheduled node serves it and last ran recently
// enough (within 3x its own interval) to be trusted to run again soon.
export async function getWorkerAvailability(supabase: SupabaseClient, channel: string): Promise<WorkerAvailability> {
  const liveCutoff = new Date(Date.now() - LIVE_STALE_AFTER_MS).toISOString();
  const { data: liveNodes } = await supabase
    .from("worker_nodes")
    .select("id")
    .eq("run_mode", "live")
    .eq("status", "running")
    .gte("last_heartbeat", liveCutoff)
    .contains("channels", [channel])
    .limit(1);
  if (liveNodes && liveNodes.length > 0) return { available: true, via: "live" };

  const { data: scheduledNodes } = await supabase
    .from("worker_nodes")
    .select("last_run_at, schedule_interval_min")
    .eq("run_mode", "scheduled")
    .contains("channels", [channel])
    .not("last_run_at", "is", null)
    .order("last_run_at", { ascending: false })
    .limit(1);

  const node = scheduledNodes?.[0];
  if (node?.last_run_at) {
    const intervalMin = node.schedule_interval_min || DEFAULT_SCHEDULE_INTERVAL_MIN;
    const ageMs = Date.now() - new Date(node.last_run_at).getTime();
    if (ageMs <= 3 * intervalMin * 60_000) {
      const minutesSinceRun = ageMs / 60_000;
      const etaMinutes = Math.max(1, Math.ceil(intervalMin - (minutesSinceRun % intervalMin)));
      return { available: true, via: "scheduled", etaMinutes };
    }
  }

  return { available: false };
}
