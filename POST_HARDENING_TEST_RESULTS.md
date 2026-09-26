# Post-Hardening Test Results

## What "verified" means in this document
There is no automated test suite (see `PRE_HARDENING_STATUS.md`), and this
pass did not perform live black-box attacks against the running
production app (no destructive/adversarial testing against real customer
data, per the audit's own constraints). "Verified" below means: re-read
the fixed code end-to-end and confirmed the exploit path no longer exists,
confirmed via `tsc`/`build`, and — for database changes — confirmed
against the live schema directly, not just that a migration command
exited 0.

## Build & type safety

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npm run build` (includes Next's own lint pass) | PASS |
| `npm audit --omit=dev` | 2 vulnerabilities remain (both Next.js/transitive postcss — down from 3; nodemailer's 12 CVEs resolved) |

## Security regression checks

| Check | Method | Result |
|---|---|---|
| `/api/generate/hashtags` requires auth | Re-read route: `getSessionWorkspaceId()` check present, 401 on missing session | PASS |
| `/api/generate/message` requires auth | Same | PASS |
| Razorpay verify-payment ignores client `plan` | Re-read route: no `plan` field read from request body anywhere in the file | PASS |
| PayPal capture-order ignores client `plan` | Re-read route: no `plan` query param read anywhere; return URL no longer includes it | PASS |
| Payment grant always matches server-recorded order | Traced: both routes now `select ... from payment_orders where provider_order_id = X and workspace_id = session.workspaceId and status = 'pending'`, grant `order.plan`, never client input | PASS |
| Rate limiter is atomic under concurrency | Re-read `increment_rate_limit()`: single `insert ... on conflict do update set count = count + 1 returning count`, one round-trip, no separate read-then-write | PASS |
| `rate_limit_counters` / `payment_orders` RLS scoped correctly | Queried live: both tables have `relrowsecurity = true` and a workspace-membership policy, confirmed via `pg_class`/`pg_policies` | PASS |
| `worker_nodes` still correctly locked to `platform_admins` | Re-queried live `pg_policies` for `worker_nodes` — only `platform_admins`-gated policies present | PASS (no regression from this pass) |
| No table anywhere has an overly-permissive policy | Live query for `qual ilike '%true%'` excluding workspace/auth.uid-scoped ones | Zero rows |
| nodemailer CVEs closed | `npm ls nodemailer` shows `10.0.10`; `npm audit` no longer lists it | PASS |

## Functional regression (things that should still work)

Checked by re-reading the modified files for accidental behavior changes,
since there's no way to click through the live app in this environment:

- **Hashtag generation**: still returns the same AI/heuristic-fallback
  shape; only new behavior is a 401 (no session) or 429 (over quota/rate)
  in cases that were previously silently allowed. Existing logged-in,
  under-quota usage is unaffected.
- **Message generation**: same — only newly rejects what should always
  have been rejected.
- **PayPal checkout**: create → redirect → capture flow is unchanged from
  the customer's point of view; the only removed piece is the `plan`
  query parameter on the return URL, which was never displayed to the
  user and is no longer needed since `capture-order` reads it from
  `payment_orders` instead.
- **Razorpay checkout**: same reasoning — `verify-payment`'s response
  still includes `success: true` and now also `plan` (the *actual*
  granted plan) for the frontend to display if it chooses to.
- **Maps discovery / Support chat**: unaffected below their new rate
  limits; only newly rejects rapid-fire calls past 5/min and 15/min
  respectively.

**Not independently confirmed by actually running the app in a browser** —
this is the honest limit of what could be verified in this environment.
Recommend a real click-through of billing (both providers, sandbox/test
mode), hashtag generation, and Maps discovery after this deploys, before
fully trusting the fixes in production.

## Remaining known issues (see `PRODUCTION_SECURITY_CHECKLIST.md` for full detail)
- Next.js dependency vulnerabilities — requires a major-version upgrade,
  owner-scheduled.
- `leadsDay`/`dmsHour` quotas still client-side only.
- No automated regression suite exists to catch a future break of any of
  the above.
