import { SupabaseClient } from "@supabase/supabase-js";
import { PLAN_LIMITS } from "@/lib/store/initial-data";

// Every X action (a DM send, a profile lookup) is billed to the platform's
// shared X Developer App under X's pay-per-use pricing — the customer never
// sees an X bill, so nothing stops a single connected workspace from
// running up real, uncapped cost unless we enforce a ceiling here, before
// the API call happens (not after).
export async function checkAndIncrementXUsage(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: workspace } = await supabase.from("workspaces").select("plan").eq("id", workspaceId).single();
  const plan = (workspace?.plan || "Trial") as keyof typeof PLAN_LIMITS;
  const dailyCap = PLAN_LIMITS[plan]?.xActionsDay ?? PLAN_LIMITS.Trial.xActionsDay;

  const { data: settings } = await supabase.from("workspace_settings").select("x").eq("workspace_id", workspaceId).maybeSingle();
  const x = settings?.x || {};
  const today = new Date().toISOString().slice(0, 10);
  const currentCount = x.xUsageDate === today ? x.xUsageCount || 0 : 0;

  if (currentCount >= dailyCap) {
    return {
      ok: false,
      error: `Daily X action limit reached (${dailyCap}/day on your ${plan} plan) — upgrade your plan for a higher limit, or try again tomorrow.`,
    };
  }

  await supabase.from("workspace_settings").upsert({
    workspace_id: workspaceId,
    x: { ...x, xUsageDate: today, xUsageCount: currentCount + 1 },
  });

  return { ok: true };
}
