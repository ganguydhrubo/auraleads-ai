import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

// Session-aware client for use inside Route Handlers / Server Components.
// Reads the user's auth cookie so RLS policies (workspace_id in my_workspace_ids)
// apply automatically — this is what every workspace-scoped API route should use.
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // called from a Server Component render — middleware refreshes the session instead
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // ignore, see above
          }
        },
      },
    }
  );
}

// Service-role client that bypasses RLS entirely. Only ever use this for:
// - webhook ingestion (Instagram/WhatsApp callbacks with no user session)
// - the signup bootstrap RPC
// - the LinkedIn worker's callback endpoint
// Never expose this client or SUPABASE_SERVICE_ROLE_KEY to the browser.
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set — required for admin/service operations");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Resolves the signed-in user's workspace id, or null if not authenticated /
// no workspace membership exists yet. Every workspace-scoped API route calls
// this first and 401s if it comes back null.
export async function getSessionWorkspaceId(): Promise<{ userId: string; workspaceId: string } | null> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) return null;

  return { userId: user.id, workspaceId: membership.workspace_id };
}
