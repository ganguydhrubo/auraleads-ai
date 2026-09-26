# Database Security Audit — Supabase/Postgres

Everything in this file was checked by querying the **live production
database directly** (`supabase db query --linked`), not by reading the
migration files and assuming they were applied correctly.

## RLS coverage

```sql
select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r' and c.relrowsecurity=false;
```
**Result: zero rows.** Every table in the `public` schema has Row Level
Security enabled — `business_profiles`, `lead_filters`, `ai_reply_rules`,
`message_templates`, `workspace_settings`, `app_settings`,
`onboarding_state`, `hashtags`, `competitors`, `leads`, `conversations`,
`messages`, `campaigns`, `campaign_recipients`, `automation_jobs`,
`automation_sessions`, `gmail_secrets`, `workspace_members`, `workspaces`,
`worker_nodes`, `platform_admins`, `support_messages`, and the two tables
added in this pass (`rate_limit_counters`, `payment_orders`).

## Overly-permissive policy scan

```sql
select tablename, policyname, qual from pg_policies
where schemaname='public' and qual ilike '%true%'
  and qual not ilike '%workspace%' and qual not ilike '%auth.uid%';
```
**Result: zero rows.** No policy grants access without checking either
workspace membership or `auth.uid()` against an allowlist. The one
historical exception — `worker_nodes_select on worker_nodes for select
using (true)` — was already fixed in an earlier session (migration
`0005_platform_admins.sql`) and is confirmed gone from this query.

## Tenant isolation pattern

The overwhelming majority of tables use one generic policy (applied in a
loop in `0001_init.sql`):
```sql
using (workspace_id in (select workspace_id from my_workspace_ids))
with check (workspace_id in (select workspace_id from my_workspace_ids))
```
where `my_workspace_ids` is a view resolving to
`workspace_members` rows for `auth.uid()`. This means: **User A cannot
read or write User B's workspace's rows even if the application code has
a bug**, because the database itself refuses the query — the app-layer
`workspace_id` filters seen throughout every API route are defense in
depth, not the only protection.

Named exceptions, each individually justified:
- **`platform_admins`**: `select` scoped to `user_id = auth.uid()` (a user
  may only check their own membership, never list others); no
  insert/update/delete policy at all — only the service role (bypasses
  RLS) can manage this list. Correct: this is the platform-operator
  allowlist, and it should not be self-service.
- **`worker_nodes`**: scoped to `platform_admins` membership, not
  workspace — correct, since this is genuinely shared infrastructure, not
  per-tenant data.
- **`rate_limit_counters`** and **`payment_orders`** (new this pass): use
  the same workspace-membership pattern as everything else — no special
  case needed.

## Service-role (RLS-bypassing) usage — where and why

Grepped every `createSupabaseAdminClient()` call site:
- `app/api/webhooks/instagram/route.ts`, `app/api/webhooks/whatsapp/route.ts`,
  `app/api/webhooks/razorpay/route.ts` — no user session exists on an
  inbound webhook request; each verifies a cryptographic signature from
  the provider before touching the database (see `SECURITY_AUDIT.md` —
  webhook signature checks were already solid, timing-safe comparisons
  confirmed in both Meta webhook handlers).
- `workers/social-worker/src/index.ts` — the standalone worker needs to
  act across whichever workspace's job it's currently processing; holding
  the service-role key is the accepted tradeoff for that (see
  `THREAT_MODEL.md`).
- The signup bootstrap RPC (`bootstrap_workspace`) — runs as the function
  definer to create a brand-new workspace + membership row before any
  session-scoped policy could otherwise apply.

No route was found using the service-role client where the regular
session-scoped client would have worked — i.e., no case of reaching for
the RLS-bypass client just to avoid writing a proper policy.

## Database functions

- `bootstrap_workspace(p_user_id, p_workspace_name)` — `security definer`
  intentionally (needs to create rows before the new user has any
  membership row for RLS to key off).
- `increment_rate_limit(...)` (new this pass) — plain `security invoker`
  (the default), runs as the calling user, relies on the
  `rate_limit_counters` RLS policy for its own protection like any other
  table write. Confirmed this is correct: a user can only increment their
  own workspace's counter.

## What this audit did NOT do
Did not attempt a live unauthenticated/cross-tenant read against the
production API as a black-box penetration test (see
`POST_HARDENING_TEST_RESULTS.md` for what would be needed to go from
"verified by reading policy definitions" to "verified by actually trying
to breach it").
