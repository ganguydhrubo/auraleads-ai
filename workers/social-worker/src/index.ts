import "dotenv/config";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { decryptSecret } from "./crypto";
import { applyLinkedInSession, searchLinkedInPeople, sendLinkedInConnectionRequest, sendLinkedInMessage } from "./linkedin";
import { applyInstagramSession, searchInstagramHashtag, searchInstagramFollowers, sendInstagramDirectMessage } from "./instagram";
import { sleep } from "./pacing";
import { isWorkspaceUnlimited } from "./entitlements";
import { sendXDm } from "./x-send";
import { sendColdEmail } from "./email";
import { upsertConversationAndMessage } from "./conversations";

// Kept in sync with lib/store/initial-data.ts's PLAN_LIMITS.leadsDay in the
// main app — this worker is a separate deployable package (its own
// tsconfig/rootDir), so it can't import across that boundary.
const LEADS_DAY_BY_PLAN: Record<string, number> = { Trial: 10, Silver: 40, Gold: 80, Platinum: 200 };

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || 15000);
const HEADFUL = process.env.HEADFUL === "true";

// Two run modes:
//  - long-running (default): unchanged from before this PR — polls forever,
//    serves LinkedIn/Instagram browser automation. Meant for a laptop or a
//    persistent host.
//  - --once / WORKER_MODE=once: processes a bounded batch and exits 0. Meant
//    for a scheduled CI runner (see .github/workflows/social-worker.yml),
//    which defaults to email/X only — Instagram/LinkedIn stay off scheduled
//    infra by design (datacenter IPs get flagged).
const ONCE_MODE = process.argv.includes("--once") || process.env.WORKER_MODE === "once";
const DEFAULT_CHANNELS = ONCE_MODE ? ["email", "x"] : ["instagram", "linkedin"];
const WORKER_CHANNELS = (process.env.WORKER_CHANNELS?.split(",").map((c) => c.trim()).filter(Boolean)) || DEFAULT_CHANNELS;
const MAX_JOBS_PER_RUN = Number(process.env.MAX_JOBS_PER_RUN || 10);
const TIME_BUDGET_SEC = Number(process.env.TIME_BUDGET_SEC || 900);

type Job = {
  id: string;
  workspace_id: string;
  platform: "linkedin" | "instagram" | "email" | "x";
  action: "search" | "view_profile" | "connect" | "message";
  payload: any;
};

// Atomic across concurrent runs (the laptop worker and a scheduled run, or
// two overlapping scheduled runs) — a single UPDATE gated by SELECT ... FOR
// UPDATE SKIP LOCKED inside the DB function, so two processes can never
// claim the same job. See migration 0010_scheduled_worker.sql.
async function claimNextJob(channels: string[]): Promise<Job | null> {
  const { data, error } = await supabase.rpc("claim_next_automation_job", { p_channels: channels });
  if (error) {
    console.error("[social-worker] claim_next_automation_job failed:", error.message);
    return null;
  }
  return (data as Job) ?? null;
}

async function checkDailyCap(workspaceId: string, platform: string, action: string, limit: number): Promise<boolean> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("automation_jobs")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("platform", platform)
    .eq("action", action)
    .eq("status", "done")
    .gte("completed_at", todayStart.toISOString());
  return (count || 0) < limit;
}

async function getSessionCookie(workspaceId: string, platform: string): Promise<string | null> {
  const { data } = await supabase
    .from("automation_sessions")
    .select("encrypted_session")
    .eq("workspace_id", workspaceId)
    .eq("platform", platform)
    .maybeSingle();
  if (!data) return null;
  return decryptSecret(data.encrypted_session);
}

async function runJob(job: Job) {
  // Email/X have real APIs and need no browser at all — resolve these before
  // ever launching Chromium, so a scheduled run that only ever sees
  // email/x jobs (the Actions default) never pays for or risks a browser.
  if (job.platform === "email") {
    if (job.action !== "message") throw new Error(`Unsupported action for email: ${job.action}`);
    await sendColdEmail(supabase, job.workspace_id, job.payload.leadId);
    await supabase.from("automation_jobs").update({ status: "done", completed_at: new Date().toISOString(), result: { ok: true } }).eq("id", job.id);
    return;
  }
  if (job.platform === "x") {
    if (job.action !== "message") throw new Error(`Unsupported action for x: ${job.action}`);
    await sendXDm(supabase, job.workspace_id, job.payload.leadId);
    await supabase.from("automation_jobs").update({ status: "done", completed_at: new Date().toISOString(), result: { ok: true } }).eq("id", job.id);
    return;
  }

  // From here on, job.platform is narrowed to "linkedin" | "instagram" by TS.
  const cookie = await getSessionCookie(job.workspace_id, job.platform);
  if (!cookie) throw new Error(`No saved ${job.platform} session for this workspace.`);

  const browser = await chromium.launch({ headless: !HEADFUL });
  const context = await browser.newContext();

  try {
    if (job.platform === "linkedin") await applyLinkedInSession(context, cookie);
    else await applyInstagramSession(context, cookie);

    const page = await context.newPage();

    if (job.action === "search") {
      const found: any[] = [];

      if (job.platform === "linkedin") {
        const query = job.payload.query || (job.payload.filters?.contentThemes || []).join(" ") || "founder";
        const people = await searchLinkedInPeople(page, query);
        for (const p of people) {
          found.push({
            workspace_id: job.workspace_id,
            platform: "linkedin",
            username: p.profileUrl.split("/in/")[1]?.replace(/\/$/, "") || p.name,
            name: p.name,
            bio: p.headline,
            location: p.location,
            website: p.profileUrl,
            source: "search",
            source_ref: query,
            decision: "pending",
            metadata: { profileUrl: p.profileUrl, connectionDegree: p.connectionDegree },
          });
        }
      } else if (job.payload.competitorUsername) {
        const competitorUsername: string = job.payload.competitorUsername;
        const followers = await searchInstagramFollowers(page, competitorUsername);
        for (const p of followers) {
          found.push({
            workspace_id: job.workspace_id,
            platform: "instagram",
            username: p.username,
            name: p.username,
            source: "competitor",
            source_ref: "@" + competitorUsername.replace(/^@/, ""),
            decision: "pending",
            metadata: {},
          });
        }
      } else {
        const hashtags: string[] = job.payload.hashtags?.length ? job.payload.hashtags : ["business"];
        for (const tag of hashtags.slice(0, 3)) {
          const posts = await searchInstagramHashtag(page, tag);
          for (const p of posts) {
            found.push({
              workspace_id: job.workspace_id,
              platform: "instagram",
              username: p.username,
              name: p.username,
              source: "hashtag",
              source_ref: tag,
              decision: "pending",
              metadata: { postUrl: p.postUrl },
            });
          }
        }
      }

      // De-dupe against existing leads in this workspace by username before inserting.
      const { data: existingLeads } = await supabase
        .from("leads")
        .select("username")
        .eq("workspace_id", job.workspace_id)
        .eq("platform", job.platform);
      const existingUsernames = new Set((existingLeads || []).map((l: any) => l.username));
      let toInsert = found.filter((f) => !existingUsernames.has(f.username));

      // leadsDay was never enforced here at all — a "search" job could insert
      // an unbounded number of new leads regardless of plan. It's a
      // workspace-wide daily cap across every lead source, so count leads
      // found today on ANY platform, not just this job's.
      if (toInsert.length > 0 && !(await isWorkspaceUnlimited(supabase, job.workspace_id))) {
        const { data: workspace } = await supabase.from("workspaces").select("plan").eq("id", job.workspace_id).single();
        const dailyCap = LEADS_DAY_BY_PLAN[workspace?.plan] ?? LEADS_DAY_BY_PLAN.Trial;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const { count: foundToday } = await supabase
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", job.workspace_id)
          .gte("found_at", todayStart.toISOString());
        const remaining = Math.max(0, dailyCap - (foundToday || 0));
        if (toInsert.length > remaining) toInsert = toInsert.slice(0, remaining);
      }

      if (toInsert.length > 0) {
        await supabase.from("leads").insert(toInsert);
      }

      await supabase.from("automation_jobs").update({
        status: "done",
        completed_at: new Date().toISOString(),
        result: { found: found.length, inserted: toInsert.length },
      }).eq("id", job.id);
      return;
    }

    if (job.action === "connect" || job.action === "message") {
      const { data: settings } = await supabase.from("workspace_settings").select("linkedin").eq("workspace_id", job.workspace_id).maybeSingle();
      const limit = job.action === "connect" ? settings?.linkedin?.dailyConnectionLimit ?? 20 : settings?.linkedin?.dailyMessageLimit ?? 30;
      const unlimited = await isWorkspaceUnlimited(supabase, job.workspace_id);
      const underCap = unlimited || (await checkDailyCap(job.workspace_id, job.platform, job.action, limit));
      if (!underCap) throw new Error(`Daily ${job.action} limit reached for ${job.platform} — try again tomorrow.`);

      const { data: lead } = await supabase.from("leads").select("*").eq("id", job.payload.leadId).single();
      if (!lead) throw new Error("Lead not found.");

      if (job.action === "connect") {
        if (job.platform !== "linkedin") throw new Error("Connection requests only apply to LinkedIn.");
        await sendLinkedInConnectionRequest(page, lead.website, lead.generated_dm || undefined);
        await supabase.from("leads").update({ metadata: { ...lead.metadata, connectionSent: true } }).eq("id", lead.id);
      } else {
        const text = lead.generated_dm || "";
        if (!text) throw new Error("No generated message on this lead yet — write one in Templates first.");

        if (job.platform === "linkedin") {
          await sendLinkedInMessage(page, lead.website, text);
        } else {
          await sendInstagramDirectMessage(page, lead.username, text);
        }

        await supabase.from("leads").update({ dm_sent: true }).eq("id", lead.id);
        await upsertConversationAndMessage(supabase, job.workspace_id, lead.id, job.platform, lead.name, "@" + lead.username, text);
      }

      await supabase.from("automation_jobs").update({ status: "done", completed_at: new Date().toISOString(), result: { ok: true } }).eq("id", job.id);
      return;
    }

    throw new Error(`Unsupported action: ${job.action}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

// The app has no other way to tell whether a worker is actually running —
// without this, it queues jobs and claims success even when nothing will
// ever pick them up. See lib/automation/worker-status.ts, which the API
// checks before accepting new jobs.
const WORKER_LABEL = process.env.WORKER_LABEL || `social-worker-${process.pid}`;
let workerNodeId: string | null = null;
// Tracked so a forced shutdown (SIGTERM/SIGINT — e.g. the Actions runner's
// own timeout, or Ctrl+C) can mark an in-flight job for manual review
// instead of leaving it stuck as 'running' forever or silently requeuing it
// (a DM/email may already have gone out).
let currentJobId: string | null = null;

async function registerNode(opts?: { runMode: "live" | "scheduled"; channels: string[]; scheduleIntervalMin?: number }) {
  const runMode = opts?.runMode ?? "live";
  const channels = opts?.channels ?? ["instagram", "linkedin"];
  const patch: Record<string, unknown> = { status: "running", last_heartbeat: new Date().toISOString(), run_mode: runMode, channels };
  // Nothing else knows the cron cadence at runtime — the worker reports it
  // itself so lib/automation/worker-status.ts's "next run in ~N min" ETA
  // stays correct if the schedule ever changes (keep WORKER_SCHEDULE_INTERVAL_MIN
  // in sync with the cron in .github/workflows/social-worker.yml).
  if (runMode === "scheduled") patch.schedule_interval_min = opts?.scheduleIntervalMin ?? Number(process.env.WORKER_SCHEDULE_INTERVAL_MIN || 30);

  const { data: existing } = await supabase.from("worker_nodes").select("id").eq("label", WORKER_LABEL).maybeSingle();
  if (existing) {
    workerNodeId = existing.id;
    await supabase.from("worker_nodes").update(patch).eq("id", existing.id);
  } else {
    const { data: created } = await supabase
      .from("worker_nodes")
      .insert({ label: WORKER_LABEL, kind: "scraper", ...patch })
      .select()
      .single();
    workerNodeId = created?.id ?? null;
  }
}

async function heartbeat() {
  if (!workerNodeId) return;
  await supabase.from("worker_nodes").update({ status: "running", last_heartbeat: new Date().toISOString() }).eq("id", workerNodeId);
}

async function markStopped() {
  if (!workerNodeId) return;
  await supabase.from("worker_nodes").update({ status: "idle", last_run_at: new Date().toISOString() }).eq("id", workerNodeId);
}

async function markCurrentJobNeedsReviewIfAny() {
  if (!currentJobId) return;
  await supabase.from("automation_jobs").update({
    status: "needs_review",
    completed_at: new Date().toISOString(),
    error: "Worker stopped (timeout/signal) while this job was in progress. Not auto-requeued — a send may already have gone out. Verify manually before resending.",
  }).eq("id", currentJobId);
  currentJobId = null;
}

async function loop() {
  console.log(`[social-worker] registering as "${WORKER_LABEL}" (live) and polling channels=[${WORKER_CHANNELS.join(",")}]...`);
  await registerNode({ runMode: "live", channels: WORKER_CHANNELS });

  while (true) {
    try {
      await heartbeat();
      const job = await claimNextJob(WORKER_CHANNELS);
      if (!job) {
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      currentJobId = job.id;
      console.log(`[social-worker] running job ${job.id} (${job.platform}/${job.action})`);
      try {
        await runJob(job);
        console.log(`[social-worker] job ${job.id} done`);
      } catch (err: any) {
        // Full detail (may include a lead's handle/email) goes only to
        // automation_jobs.error, readable by that workspace via the app —
        // never to stdout, which a shared CI log or terminal can expose.
        console.error(`[social-worker] job ${job.id} failed (see automation_jobs.error for details)`);
        await supabase.from("automation_jobs").update({ status: "failed", completed_at: new Date().toISOString(), error: err.message }).eq("id", job.id);
      } finally {
        currentJobId = null;
      }
    } catch (loopErr: any) {
      console.error("[social-worker] loop error:", loopErr.message);
      await sleep(POLL_INTERVAL_MS);
    }
  }
}

// Bounded batch for a scheduled runner (see .github/workflows/social-worker.yml):
// process jobs until the queue (for the allowed channels) is empty, or
// MAX_JOBS_PER_RUN, or TIME_BUDGET_SEC — whichever comes first — then exit 0.
// Always exits 0 on a clean run; individual job failures are expected and
// don't fail the run (they're recorded on the job itself).
async function runOnce() {
  console.log(`[social-worker] once-mode: channels=[${WORKER_CHANNELS.join(",")}] maxJobs=${MAX_JOBS_PER_RUN} timeBudgetSec=${TIME_BUDGET_SEC}`);
  await registerNode({ runMode: "scheduled", channels: WORKER_CHANNELS });

  // Informational only (reported in the exit summary) — doesn't affect
  // claiming. Lets you see at a glance whether there was other queued work
  // this run intentionally left alone (e.g. instagram/linkedin jobs).
  const { data: allQueued } = await supabase.from("automation_jobs").select("platform").eq("status", "queued");
  const skippedByChannel = (allQueued || []).filter((j: any) => !WORKER_CHANNELS.includes(j.platform)).length;

  // Keeps last_heartbeat fresh for the whole run's duration, independent of
  // the 45-120s pacing gaps between sends, so Admin > Worker Nodes shows
  // this node as live while it works.
  const heartbeatTimer = setInterval(() => {
    heartbeat().catch((err) => console.error("[social-worker] heartbeat failed:", err.message));
  }, POLL_INTERVAL_MS);

  const startedAt = Date.now();
  let claimed = 0, sent = 0, failed = 0, needsReview = 0;

  try {
    while (claimed < MAX_JOBS_PER_RUN && (Date.now() - startedAt) / 1000 < TIME_BUDGET_SEC) {
      const job = await claimNextJob(WORKER_CHANNELS);
      if (!job) break; // queue empty for these channels

      claimed++;
      currentJobId = job.id;
      console.log(`[social-worker] running job ${job.id} (${job.platform}/${job.action})`);
      try {
        await runJob(job);
        console.log(`[social-worker] job ${job.id} done`);
        sent++;
      } catch (err: any) {
        // See the matching comment in loop() — full detail stays DB-only.
        console.error(`[social-worker] job ${job.id} failed (see automation_jobs.error for details)`);
        await supabase.from("automation_jobs").update({ status: "failed", completed_at: new Date().toISOString(), error: err.message }).eq("id", job.id);
        failed++;
      } finally {
        currentJobId = null;
      }

      if (claimed < MAX_JOBS_PER_RUN) {
        const delayMs = Math.round((45 + Math.random() * 75) * 1000); // 45-120s
        await sleep(delayMs);
      }
    }
  } finally {
    clearInterval(heartbeatTimer);
  }

  // The loop above always clears currentJobId itself after each job, win or
  // lose, so a non-zero count here only happens if the process is racing a
  // concurrent SIGTERM (see shutdown()) — this is a safety net, not the
  // normal path.
  if (currentJobId) {
    await markCurrentJobNeedsReviewIfAny();
    needsReview++;
  }
  await markStopped();

  console.log(`SOCIAL_WORKER_SUMMARY claimed=${claimed} sent=${sent} failed=${failed} needs_review=${needsReview} skipped_by_channel=${skippedByChannel}`);
  process.exit(0);
}

async function shutdown() {
  const hadInFlightJob = !!currentJobId;
  await markCurrentJobNeedsReviewIfAny();
  await markStopped();
  if (hadInFlightJob) console.log("SOCIAL_WORKER_SUMMARY interrupted needs_review=1");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

if (ONCE_MODE) runOnce();
else loop();
