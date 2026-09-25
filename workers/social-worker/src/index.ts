import "dotenv/config";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { decryptSecret } from "./crypto";
import { applyLinkedInSession, searchLinkedInPeople, sendLinkedInConnectionRequest, sendLinkedInMessage } from "./linkedin";
import { applyInstagramSession, searchInstagramHashtag, searchInstagramFollowers, sendInstagramDirectMessage } from "./instagram";
import { sleep } from "./pacing";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || 15000);
const HEADFUL = process.env.HEADFUL === "true";

type Job = {
  id: string;
  workspace_id: string;
  platform: "linkedin" | "instagram";
  action: "search" | "view_profile" | "connect" | "message";
  payload: any;
};

async function claimNextJob(): Promise<Job | null> {
  const { data: jobs } = await supabase
    .from("automation_jobs")
    .select("*")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1);

  if (!jobs || jobs.length === 0) return null;
  const job = jobs[0] as Job;

  const { data: claimed } = await supabase
    .from("automation_jobs")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", job.id)
    .eq("status", "queued")
    .select()
    .maybeSingle();

  return claimed ? (claimed as Job) : null;
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

async function upsertConversationAndMessage(workspaceId: string, leadId: string, platform: string, contactName: string, contactHandle: string, text: string) {
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("lead_id", leadId)
    .maybeSingle();

  let conversationId = existing?.id;
  if (!conversationId) {
    const { data: created } = await supabase
      .from("conversations")
      .insert({ workspace_id: workspaceId, lead_id: leadId, channel: platform, contact_name: contactName, contact_handle: contactHandle, contact_type: "lead" })
      .select()
      .single();
    conversationId = created?.id;
  }

  if (conversationId) {
    await supabase.from("messages").insert({ workspace_id: workspaceId, conversation_id: conversationId, sender: "me", channel: platform, content: text });
    await supabase.from("conversations").update({ last_active: new Date().toISOString() }).eq("id", conversationId);
  }
}

async function runJob(job: Job) {
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
      const toInsert = found.filter((f) => !existingUsernames.has(f.username));

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
      const underCap = await checkDailyCap(job.workspace_id, job.platform, job.action, limit);
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
        await upsertConversationAndMessage(job.workspace_id, lead.id, job.platform, lead.name, "@" + lead.username, text);
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

async function loop() {
  console.log("[social-worker] polling for jobs...");
  while (true) {
    try {
      const job = await claimNextJob();
      if (!job) {
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      console.log(`[social-worker] running job ${job.id} (${job.platform}/${job.action})`);
      try {
        await runJob(job);
        console.log(`[social-worker] job ${job.id} done`);
      } catch (err: any) {
        console.error(`[social-worker] job ${job.id} failed:`, err.message);
        await supabase.from("automation_jobs").update({ status: "failed", completed_at: new Date().toISOString(), error: err.message }).eq("id", job.id);
      }
    } catch (loopErr: any) {
      console.error("[social-worker] loop error:", loopErr.message);
      await sleep(POLL_INTERVAL_MS);
    }
  }
}

loop();
