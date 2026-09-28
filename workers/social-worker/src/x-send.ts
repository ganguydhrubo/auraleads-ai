import { SupabaseClient } from "@supabase/supabase-js";
import { TwitterApi } from "twitter-api-v2";
import { getValidXAccessToken } from "./x-oauth-token";
import { upsertConversationAndMessage } from "./conversations";
import { isWorkspaceUnlimited } from "./entitlements";

// Kept in sync with lib/store/initial-data.ts's PLAN_LIMITS.xActionsDay in
// the main app (see LEADS_DAY_BY_PLAN in index.ts for the same pattern).
const X_ACTIONS_DAY_BY_PLAN: Record<string, number> = { Trial: 10, Silver: 20, Gold: 60, Platinum: 150 };

// Every X action via the shared OAuth2 app is billed to the platform, not
// the customer (see lib/x/usage.ts) — ported here rather than bypassed
// outright, matching the deliberate "don't bypass this even for the
// unlimited/owner account" decision made in feat/owner-unlimited.
async function checkAndIncrementXUsage(supabase: SupabaseClient, workspaceId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: workspace } = await supabase.from("workspaces").select("plan").eq("id", workspaceId).single();
  const plan = workspace?.plan || "Trial";
  const dailyCap = X_ACTIONS_DAY_BY_PLAN[plan] ?? X_ACTIONS_DAY_BY_PLAN.Trial;

  const { data: settings } = await supabase.from("workspace_settings").select("x").eq("workspace_id", workspaceId).maybeSingle();
  const x = settings?.x || {};
  const today = new Date().toISOString().slice(0, 10);
  const currentCount = x.xUsageDate === today ? x.xUsageCount || 0 : 0;

  if (currentCount >= dailyCap) {
    return { ok: false, error: `Daily X action limit reached (${dailyCap}/day on your ${plan} plan).` };
  }

  await supabase.from("workspace_settings").upsert({
    workspace_id: workspaceId,
    x: { ...x, xUsageDate: today, xUsageCount: currentCount + 1 },
  });
  return { ok: true };
}

// Cold (or reply-continuation) X DM to a lead, ported from
// app/api/channels/x/send-dm/route.ts so it can run from the scheduled
// worker instead of a synchronous, session-authenticated API route. Never
// logs the token itself — only high-level outcomes.
export async function sendXDm(supabase: SupabaseClient, workspaceId: string, leadId: string): Promise<void> {
  const { data: lead } = await supabase.from("leads").select("*").eq("id", leadId).eq("workspace_id", workspaceId).single();
  if (!lead) throw new Error("Lead not found.");
  if (!lead.generated_dm) throw new Error("This lead has no generated message yet.");

  const { data: settings } = await supabase.from("workspace_settings").select("x").eq("workspace_id", workspaceId).maybeSingle();
  const x = settings?.x;
  if (!x?.connected) throw new Error("X is not connected for this workspace.");

  const oauth2Token = await getValidXAccessToken(supabase, workspaceId);

  if (oauth2Token) {
    // Billed to the platform's shared Developer App — enforce the plan's
    // daily cap before spending it. The OAuth 1.0a manual-keys path below
    // uses the customer's OWN Developer App, so no cap applies there.
    if (!(await isWorkspaceUnlimited(supabase, workspaceId))) {
      const usage = await checkAndIncrementXUsage(supabase, workspaceId);
      if (!usage.ok) throw new Error(usage.error);
    }

    const lookupRes = await fetch(`https://api.twitter.com/2/users/by/username/${lead.username}`, {
      headers: { Authorization: `Bearer ${oauth2Token}` },
    });
    const lookupData = await lookupRes.json();
    if (!lookupRes.ok || !lookupData.data?.id) {
      throw new Error(lookupData.title || lookupData.detail || `Could not resolve @${lead.username} on X.`);
    }

    const dmRes = await fetch(`https://api.twitter.com/2/dm_conversations/with/${lookupData.data.id}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${oauth2Token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: lead.generated_dm }),
    });
    if (!dmRes.ok) {
      const dmData = await dmRes.json().catch(() => ({}));
      throw new Error(dmData.title || dmData.detail || dmData.errors?.[0]?.message || "X DM send failed.");
    }
  } else {
    if (!x.appKey || !x.accessToken) throw new Error("X is not connected for this workspace.");
    const client = new TwitterApi({ appKey: x.appKey, appSecret: x.appSecret, accessToken: x.accessToken, accessSecret: x.accessSecret });
    const recipient = await client.v2.userByUsername(lead.username);
    if (!recipient?.data?.id) throw new Error(`Could not resolve @${lead.username} on X.`);
    // v1 DM-send endpoint: available at X's Basic API tier for many developer
    // accounts, where v2's DM-send endpoints need a higher access tier under
    // OAuth 1.0a specifically.
    await client.v1.sendDm({ recipient_id: recipient.data.id, text: lead.generated_dm });
  }

  await supabase.from("leads").update({ dm_sent: true }).eq("id", leadId);
  await upsertConversationAndMessage(supabase, workspaceId, leadId, "x", lead.name, "@" + lead.username, lead.generated_dm);
}
