-- Adds a metadata slot to conversations for channel-specific routing info
-- (e.g. the Instagram PSID a webhook message came from, needed to send a
-- reply back via the Graph Send API).
alter table conversations add column if not exists metadata jsonb not null default '{}'::jsonb;

-- Real support inbox — the in-app support widget writes here instead of
-- faking an instant "request approved" reply.
create table if not exists support_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);
alter table support_messages enable row level security;
create policy support_messages_all on support_messages for all
  using (workspace_id in (select workspace_id from my_workspace_ids))
  with check (workspace_id in (select workspace_id from my_workspace_ids));
