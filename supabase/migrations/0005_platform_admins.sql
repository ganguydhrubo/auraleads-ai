-- worker_nodes was designed for "a single self-hosted deployment's own
-- admins" (see the comment in 0001_init.sql), meaning workspace_members.role
-- = 'admin'. But bootstrap_workspace makes EVERY new signup the 'admin' of
-- their own workspace — so on a live multi-tenant SaaS, that policy actually
-- let any paying customer read (and, on the write policy, insert/update/
-- delete) the shared worker/proxy-node pool used by every other tenant's
-- automation jobs. This adds a real "operates the platform" concept,
-- separate from "owns a workspace", and locks worker_nodes down to it.

create table if not exists platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);

alter table platform_admins enable row level security;

-- A user may check ONLY their own membership (used by the client to decide
-- whether to show the Worker Nodes tab at all) — never list the table.
-- Inserts/deletes are intentionally left with no policy at all: only the
-- service role (or a superuser running this migration) can manage this list.
create policy platform_admins_select_self on platform_admins
  for select using (user_id = auth.uid());

drop policy if exists worker_nodes_select on worker_nodes;
drop policy if exists worker_nodes_write on worker_nodes;

create policy worker_nodes_select on worker_nodes for select
  using (exists (select 1 from platform_admins where user_id = auth.uid()));
create policy worker_nodes_write on worker_nodes for all
  using (exists (select 1 from platform_admins where user_id = auth.uid()))
  with check (exists (select 1 from platform_admins where user_id = auth.uid()));

-- Seed the one known operator account. If this email is wrong for your
-- deployment, update it before running this migration, or run the insert
-- manually afterward with the right email/user_id.
insert into platform_admins (user_id)
select id from auth.users where email = 'gangulydhrubo@gmail.com'
on conflict (user_id) do nothing;
