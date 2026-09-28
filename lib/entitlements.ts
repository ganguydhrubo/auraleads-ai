import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Whether this specific user is on the unlimited allowlist (see migration
// 0008_owner_unlimited.sql). Never trust an email or flag sent by the
// client — this always reads the DB row via the session-scoped client, whose
// RLS policy only ever lets a user see their own row.
//
// `cache()` memoises this per request (React's per-render request cache,
// same mechanism Next.js uses for request-scoped data fetching) — it does
// NOT persist across requests, so a change to unlimited_accounts takes
// effect on the very next request.
export const isUnlimited = cache(async (userId: string): Promise<boolean> => {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("unlimited_accounts")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
});
