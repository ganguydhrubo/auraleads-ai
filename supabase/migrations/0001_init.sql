-- AuraLeads AI — Core schema
-- Run this in Supabase SQL Editor (or `supabase db push`) once, in order.
-- Requires pgcrypto for gen_random_uuid() + symmetric encryption of stored API secrets.

create extension if not exists pgcrypto;

-- ============================================================
-- Workspaces & membership (real multi-tenancy on top of Supabase Auth)
-- ============================================================

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My Workspace',
  domain text,
  plan text not null default 'Trial' check (plan in ('Trial','Silver','Gold','Platinum')),
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  credits_remaining int not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists workspace_members (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index if not exists idx_workspace_members_user on workspace_members(user_id);

-- Convenience view: current user's workspace ids
create or replace view my_workspace_ids as
  select workspace_id from workspace_members where user_id = auth.uid();

-- ============================================================
-- Per-workspace singleton config tables
-- ============================================================

create table if not exists business_profiles (
  workspace_id uuid primary key references workspaces(id) on delete cascade,
  description text not null default '',
  target_region text not null default ''
);

create table if not exists lead_filters (
  workspace_id uuid primary key references workspaces(id) on delete cascade,
  criteria jsonb not null default '{}'::jsonb
);

create table if not exists ai_reply_rules (
  workspace_id uuid primary key references workspaces(id) on delete cascade,
  business_definition text not null default '',
  post_reply_instruction text not null default '',
  stop_messaging_criteria text not null default '',
  human_handoff_criteria text not null default ''
);

create table if not exists message_templates (
  workspace_id uuid primary key references workspaces(id) on delete cascade,
  hashtag_dm text not null default '',
  hashtag_email text not null default '',
  from_name text not null default '',
  company_name text not null default '',
  competitor_dm text not null default ''
);

-- workspace_settings holds BYO integration credentials. Secret fields are
-- pgp_sym_encrypt'd with app.encryption_key (set via SUPABASE_ENCRYPTION_KEY
-- server env, never sent to the browser) so a DB dump alone doesn't leak tokens.
create table if not exists workspace_settings (
  workspace_id uuid primary key references workspaces(id) on delete cascade,
  instagram jsonb not null default '{"connected": false}'::jsonb,
  gmail jsonb not null default '{"accounts": []}'::jsonb,
  whatsapp jsonb not null default '{"connected": false}'::jsonb,
  x jsonb not null default '{"connected": false}'::jsonb,
  linkedin jsonb not null default '{"connected": false}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists app_settings (
  workspace_id uuid primary key references workspaces(id) on delete cascade,
  dark_mode boolean not null default false,
  push_notifications boolean not null default true,
  daily_leads_email boolean not null default true,
  cycle_expiration_reminder boolean not null default true,
  automated_lead_generation boolean not null default false,
  automated_weekly_cycle boolean not null default false
);

create table if not exists onboarding_state (
  workspace_id uuid primary key references workspaces(id) on delete cascade,
  setup_dismissed boolean not null default false,
  steps jsonb not null default '[]'::jsonb
);

-- ============================================================
-- Growth pipeline tables
-- ============================================================

create table if not exists hashtags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  tag text not null,
  source text not null default 'ai' check (source in ('ai','manual')),
  validation_score int not null default 0,
  posts_count text not null default '0',
  relevance_score int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_hashtags_workspace on hashtags(workspace_id);

create table if not exists competitors (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  username text not null,
  name text not null default '',
  followers_count text not null default '0',
  added_at timestamptz not null default now(),
  locked_until timestamptz not null default (now() + interval '7 days')
);
create index if not exists idx_competitors_workspace on competitors(workspace_id);

-- Unified lead table across every channel (instagram, maps, linkedin, whatsapp, x)
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  platform text not null check (platform in ('instagram','maps','linkedin','whatsapp','x')),
  username text not null default '',
  name text not null default '',
  bio text not null default '',
  followers int,
  engagement text,
  category text,
  location text,
  email text,
  phone text,
  website text,
  rating numeric,
  reviews_count int,
  address text,
  city text,
  source text,
  source_ref text,
  decision text not null default 'pending' check (decision in ('matched','blocked','pending')),
  found_at timestamptz not null default now(),
  generated_dm text,
  generated_email text,
  dm_sent boolean not null default false,
  email_sent boolean not null default false,
  replied boolean not null default false,
  opened boolean not null default false,
  revealed boolean not null default false,
  executives jsonb not null default '[]'::jsonb,
  ai_score int,
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists idx_leads_workspace on leads(workspace_id);
create index if not exists idx_leads_platform on leads(workspace_id, platform);

-- ============================================================
-- Omnichannel inbox
-- ============================================================

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  channel text not null check (channel in ('instagram','email','whatsapp','x','linkedin')),
  contact_name text not null default '',
  contact_handle text not null default '',
  contact_avatar text,
  contact_type text not null default 'lead' check (contact_type in ('lead','user')),
  needs_human boolean not null default false,
  last_active timestamptz not null default now(),
  unread boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_conversations_workspace on conversations(workspace_id);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender text not null check (sender in ('me','them','ai')),
  channel text not null default 'instagram',
  content text not null default '',
  is_read boolean not null default false,
  external_id text,
  created_at timestamptz not null default now()
);
create index if not exists idx_messages_conversation on messages(conversation_id);
create index if not exists idx_messages_workspace on messages(workspace_id);

-- ============================================================
-- Campaigns
-- ============================================================

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  channel text not null check (channel in ('instagram','maps','whatsapp','x','linkedin','email')),
  mode text not null default 'manual' check (mode in ('automated','manual','advanced')),
  status text not null default 'draft' check (status in ('draft','running','paused','completed')),
  recipients_count int not null default 0,
  sent_count int not null default 0,
  replied_count int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_campaigns_workspace on campaigns(workspace_id);

create table if not exists campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued','sent','failed','replied')),
  sent_at timestamptz,
  error text
);
create index if not exists idx_campaign_recipients_campaign on campaign_recipients(campaign_id);

-- ============================================================
-- Browser-automation job queue (consumed by the separate Playwright worker
-- in /workers/social-worker). Neither LinkedIn nor Instagram expose a public
-- API for cold discovery/outreach (Meta's Hashtag Search API deliberately
-- omits post authors; LinkedIn has no third-party outreach API at all), so
-- this drives a real headless browser using the workspace's own logged-in
-- session cookie for both platforms.
-- ============================================================

create table if not exists automation_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  platform text not null check (platform in ('linkedin','instagram')),
  action text not null check (action in ('search','view_profile','connect','message')),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued','running','done','failed')),
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);
create index if not exists idx_automation_jobs_status on automation_jobs(status, created_at);
create index if not exists idx_automation_jobs_workspace on automation_jobs(workspace_id);

-- Encrypted browser session storage (li_at cookie / IG sessionid), written only
-- by the server (service role) — never returned to the browser after saving.
create table if not exists automation_sessions (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  platform text not null check (platform in ('linkedin','instagram')),
  encrypted_session text not null,
  label text,
  updated_at timestamptz not null default now(),
  primary key (workspace_id, platform)
);

-- ============================================================
-- Admin console (real worker/proxy pool bookkeeping instead of hardcoded UI)
-- ============================================================

create table if not exists worker_nodes (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  kind text not null default 'scraper' check (kind in ('scraper','linkedin_browser')),
  status text not null default 'idle' check (status in ('idle','running','error','disabled')),
  proxy text,
  last_heartbeat timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table business_profiles enable row level security;
alter table lead_filters enable row level security;
alter table ai_reply_rules enable row level security;
alter table message_templates enable row level security;
alter table workspace_settings enable row level security;
alter table app_settings enable row level security;
alter table onboarding_state enable row level security;
alter table hashtags enable row level security;
alter table competitors enable row level security;
alter table leads enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table campaigns enable row level security;
alter table campaign_recipients enable row level security;
alter table automation_jobs enable row level security;
alter table automation_sessions enable row level security;

-- workspaces: visible/editable only to members
create policy workspaces_select on workspaces for select using (id in (select workspace_id from my_workspace_ids));
create policy workspaces_update on workspaces for update using (id in (select workspace_id from my_workspace_ids));

create policy workspace_members_select on workspace_members for select using (workspace_id in (select workspace_id from my_workspace_ids));

-- generic per-table workspace-scoped policy, applied table by table
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'business_profiles','lead_filters','ai_reply_rules','message_templates',
    'workspace_settings','app_settings','onboarding_state','hashtags','competitors',
    'leads','conversations','messages','campaigns','automation_jobs'
  ])
  loop
    execute format('create policy %I_all on %I for all using (workspace_id in (select workspace_id from my_workspace_ids)) with check (workspace_id in (select workspace_id from my_workspace_ids));', t, t);
  end loop;
end $$;

create policy campaign_recipients_all on campaign_recipients for all
  using (campaign_id in (select id from campaigns where workspace_id in (select workspace_id from my_workspace_ids)))
  with check (campaign_id in (select id from campaigns where workspace_id in (select workspace_id from my_workspace_ids)));

-- worker_nodes: any authenticated user can read; only a workspace admin can write
-- (this console is meant for a single self-hosted deployment's own admins, not
-- cross-tenant SaaS staff — there's no cross-workspace concept here).
alter table worker_nodes enable row level security;
create policy worker_nodes_select on worker_nodes for select using (true);
create policy worker_nodes_write on worker_nodes for all
  using (exists (select 1 from workspace_members where user_id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from workspace_members where user_id = auth.uid() and role = 'admin'));

-- ============================================================
-- Helper: bootstrap a workspace + membership + default rows on signup.
-- Called from the server (service role) right after auth.signUp succeeds.
-- ============================================================

create or replace function bootstrap_workspace(p_user_id uuid, p_workspace_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace_id uuid;
begin
  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'cannot bootstrap a workspace for another user';
  end if;

  if exists (select 1 from workspace_members where user_id = p_user_id) then
    raise exception 'user already belongs to a workspace';
  end if;

  insert into workspaces (name) values (coalesce(nullif(p_workspace_name, ''), 'My Workspace'))
  returning id into v_workspace_id;

  insert into workspace_members (workspace_id, user_id, role) values (v_workspace_id, p_user_id, 'admin');

  insert into business_profiles (workspace_id) values (v_workspace_id);
  insert into lead_filters (workspace_id) values (v_workspace_id);
  insert into ai_reply_rules (workspace_id) values (v_workspace_id);
  insert into message_templates (workspace_id, from_name, company_name) values (v_workspace_id, '', '');
  insert into workspace_settings (workspace_id) values (v_workspace_id);
  insert into app_settings (workspace_id) values (v_workspace_id);
  insert into onboarding_state (workspace_id) values (v_workspace_id);

  return v_workspace_id;
end;
$$;
