-- Marketing copy everywhere says "7-day free trial" but the workspaces
-- table defaulted to 14 days — fixes the default for new workspaces and
-- backfills any existing trial workspace to match.
alter table workspaces alter column trial_ends_at set default (now() + interval '7 days');

update workspaces
set trial_ends_at = created_at + interval '7 days'
where plan = 'Trial';
