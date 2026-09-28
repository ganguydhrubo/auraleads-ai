-- Gives exactly one account (the owner, gangulydhrubo@gmail.com) unlimited
-- use of every plan/usage quota, with no plan limits and no trial expiry.
-- Everyone else is unaffected. This is a DB-backed allowlist, not a client
-- flag or a NEXT_PUBLIC_ env var, because every quota check in this app
-- trusts the server/DB, never the client (see SECURITY_AUDIT.md).
--
-- Plan/tier itself (workspaces.plan) is deliberately left untouched — an
-- unlimited account still has a real plan row for billing/display purposes,
-- it just bypasses every numeric cap tied to that plan. See lib/entitlements.ts.

create table if not exists unlimited_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);

alter table unlimited_accounts enable row level security;

-- A user may check ONLY their own row (used by the client to decide whether
-- to render the "Unlimited" badge). No insert/update/delete policy exists at
-- all, so only the service role (or a superuser running this migration) can
-- ever write to this table — never trust a client-supplied flag here.
create policy unlimited_accounts_select_self on unlimited_accounts
  for select using (user_id = auth.uid());

-- Seed the one known owner account. If this email is wrong for your
-- deployment, update it before running this migration, or manage the row
-- manually afterward. Requires a confirmed email so an unverified signup
-- can't grab this by registering the address first.
do $$
begin
  if not exists (
    select 1 from auth.users
    where lower(email) = 'gangulydhrubo@gmail.com' and email_confirmed_at is not null
  ) then
    raise notice 'unlimited_accounts: no confirmed user found for gangulydhrubo@gmail.com — seed skipped, insert manually once the account exists.';
  end if;
end $$;

insert into unlimited_accounts (user_id, note)
select id, 'Owner — unlimited by default'
from auth.users
where lower(email) = 'gangulydhrubo@gmail.com' and email_confirmed_at is not null
on conflict (user_id) do nothing;

-- Core primitive: is this specific user on the unlimited allowlist.
-- security definer so it can read unlimited_accounts regardless of the
-- caller's own RLS-visible row, but it only ever answers for the uid passed
-- in — it never leaks other rows.
create or replace function public.is_unlimited(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from unlimited_accounts where user_id = uid);
$$;

-- Convenience wrapper for the many enforcement points in this app that are
-- workspace-scoped rather than user-scoped (plan, quotas, worker caps all
-- key off workspace_id). True if ANY member of the workspace is unlimited.
create or replace function public.is_workspace_unlimited(ws_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from workspace_members wm
    where wm.workspace_id = ws_id and public.is_unlimited(wm.user_id)
  );
$$;
