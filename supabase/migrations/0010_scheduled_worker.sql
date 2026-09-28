-- Adds a "run-once" scheduled worker (GitHub Actions) alongside the existing
-- always-on laptop worker, so email/X outreach can process for free without
-- a laptop or a paid host. Instagram/LinkedIn (browser automation, flagged
-- from datacenter IPs) stay on the laptop worker only — see AGENTS/PR notes.
--
-- automation_jobs.platform doubles as "channel" throughout this app (one job
-- row already belongs to exactly one channel) — there's no separate
-- automation_jobs.channel column, "channel" in the RPC/env-var naming below
-- refers to this same platform value.

alter table automation_jobs drop constraint if exists automation_jobs_platform_check;
alter table automation_jobs add constraint automation_jobs_platform_check
  check (platform in ('linkedin','instagram','email','x'));

-- 'needs_review': a job that was 'running' when its worker died (timeout,
-- SIGTERM, crash) mid-send. Never auto-requeued — a DM or email may already
-- have gone out, so silently retrying risks a double-send. A human decides.
alter table automation_jobs drop constraint if exists automation_jobs_status_check;
alter table automation_jobs add constraint automation_jobs_status_check
  check (status in ('queued','running','done','failed','needs_review'));

-- worker_nodes gets a second, orthogonal axis: `kind` already means "what
-- capability does this node have" (scraper vs linkedin_browser, set by the
-- admin bookkeeping UI) — that's unrelated to "how does this node run",
-- which is what the scheduled-worker feature actually needs. Using a new
-- `run_mode` column instead of overloading `kind` keeps the two concepts
-- separate rather than colliding two unrelated enums into one.
alter table worker_nodes add column if not exists run_mode text not null default 'live' check (run_mode in ('live','scheduled'));
alter table worker_nodes add column if not exists channels text[] not null default '{}';
alter table worker_nodes add column if not exists schedule_interval_min int;
alter table worker_nodes add column if not exists last_run_at timestamptz;

-- Backfill: any node that already existed before this migration is the
-- laptop worker (registerNode() in workers/social-worker always served
-- linkedin+instagram before this PR), so it should keep being treated as
-- available for those two channels rather than suddenly serving nothing.
update worker_nodes set channels = array['instagram','linkedin'] where channels = '{}';

-- Atomic multi-node job claim: a single UPDATE gated by a SELECT ... FOR
-- UPDATE SKIP LOCKED subquery, so two runs claiming at the same moment (the
-- laptop worker and a GitHub Actions run, or two overlapping Actions runs)
-- can never grab the same job. Returns null (not a row of nulls) when
-- nothing matches. Runs only under the service-role key (see
-- workers/social-worker), so this is security invoker, not definer.
create or replace function public.claim_next_automation_job(p_channels text[])
returns automation_jobs
language plpgsql
as $$
declare
  v_job automation_jobs;
begin
  update automation_jobs
  set status = 'running', started_at = now()
  where id = (
    select id from automation_jobs
    where status = 'queued' and platform = any(p_channels)
    order by created_at asc
    for update skip locked
    limit 1
  )
  returning * into v_job;

  if not found then
    return null;
  end if;
  return v_job;
end;
$$;
