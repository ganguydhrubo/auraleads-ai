-- Gmail App Passwords are secrets, so they never go into workspace_settings.gmail
-- (that jsonb column is read directly by the browser client under RLS elsewhere
-- in this app). This table has no RLS policies, so only the service role
-- (server-side, via createSupabaseAdminClient) can ever read or write it.

create table if not exists gmail_secrets (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  email text not null,
  encrypted_app_password text not null,
  primary key (workspace_id, email)
);

alter table gmail_secrets enable row level security;
-- no policies = default deny for anon/authenticated; service role bypasses RLS
