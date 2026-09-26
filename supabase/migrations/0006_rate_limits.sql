-- No API route enforced a rate limit or a real server-side quota before
-- this — hashtagsWeek/leadsDay/dmsHour were only ever checked client-side
-- (see lib/store/app-store.tsx), so any authenticated user calling the
-- routes directly could generate unlimited Groq/Google Places API cost.
-- This is a minimal, dependency-free limiter using the existing Postgres
-- database rather than pulling in a new paid service (Redis/Upstash).

create table if not exists rate_limit_counters (
  workspace_id uuid not null,
  bucket_key text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (workspace_id, bucket_key, window_start)
);

-- Minute-granularity buckets across many workspaces will accumulate rows
-- over time with no cleanup here — fine for now, but worth pruning rows
-- older than a day or two via a scheduled job eventually.
alter table rate_limit_counters enable row level security;
create policy rate_limit_counters_all on rate_limit_counters for all
  using (workspace_id in (select workspace_id from my_workspace_ids))
  with check (workspace_id in (select workspace_id from my_workspace_ids));

-- Atomic increment-and-read so concurrent requests from the same workspace
-- can't race past the limit (a plain select-then-upsert from the app layer
-- would have a check-then-act gap under concurrency).
create or replace function increment_rate_limit(p_workspace_id uuid, p_bucket_key text, p_window_start timestamptz)
returns int
language sql
as $$
  insert into rate_limit_counters (workspace_id, bucket_key, window_start, count)
  values (p_workspace_id, p_bucket_key, p_window_start, 1)
  on conflict (workspace_id, bucket_key, window_start)
  do update set count = rate_limit_counters.count + 1
  returning count;
$$;
