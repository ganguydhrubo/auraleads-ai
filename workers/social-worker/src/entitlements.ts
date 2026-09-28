import { SupabaseClient } from "@supabase/supabase-js";

// The worker runs standalone with the service-role key (no user session), so
// it checks the public.is_workspace_unlimited() DB function directly instead
// of the session-scoped lib/entitlements.ts helper used by the Next.js app.
// True if any member of the workspace is on the unlimited allowlist
// (migration 0008_owner_unlimited.sql).
export async function isWorkspaceUnlimited(supabase: SupabaseClient, workspaceId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_workspace_unlimited", { ws_id: workspaceId });
  if (error) {
    console.error("[entitlements] is_workspace_unlimited check failed, defaulting to false:", error.message);
    return false;
  }
  return !!data;
}
