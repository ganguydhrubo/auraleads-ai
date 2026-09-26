# Security Hardening Report

Companion to `SECURITY_AUDIT.md` — this file is the "what changed and why"
reference. See that file for severity ratings and full reasoning per
finding.

## Files modified in this pass

| File | Change |
|---|---|
| `app/api/billing/razorpay/verify-payment/route.ts` | Stopped trusting client-supplied `plan`; looks up `payment_orders` instead |
| `app/api/billing/razorpay/create-order/route.ts` | Records the order in `payment_orders` at creation time |
| `app/api/webhooks/razorpay/route.ts` | Marks the matching `payment_orders` row completed for audit-trail consistency |
| `app/api/billing/paypal/capture-order/route.ts` | Same fix as Razorpay — looks up `payment_orders`, no client-supplied `plan` |
| `app/api/billing/paypal/create-order/route.ts` | Records the order in `payment_orders`; dropped `plan` from the PayPal return URL |
| `components/account/BillingView.tsx` | Stopped sending `plan` to `verify-payment` (server no longer reads it) |
| `app/api/generate/hashtags/route.ts` | Added auth check, server-side weekly quota enforcement, rate limit |
| `app/api/generate/message/route.ts` | Added auth check, rate limit, prompt-injection framing on scraped bio/name |
| `app/api/maps/scrape/route.ts` | Added rate limit (was already authenticated) |
| `app/api/support/chat/route.ts` | Added rate limit (was already authenticated) |
| `lib/rate-limit.ts` | New — Postgres-backed rate limiter, no new paid infrastructure |
| `package.json` / `package-lock.json` | `nodemailer` 6.10.1 → 10.0.10 (12 CVEs) |
| `supabase/migrations/0006_rate_limits.sql` | New — `rate_limit_counters` table + `increment_rate_limit()` function |
| `supabase/migrations/0007_payment_orders.sql` | New — `payment_orders` table, RLS scoped to the owning workspace |

## Security controls implemented or confirmed this pass

- **Payment integrity**: plan/amount granted on capture/verify is now
  always the value recorded server-side at order-creation time, never a
  value the client can supply on the confirmation call.
- **AI cost protection**: authentication + per-workspace rate limiting +
  real server-side quota enforcement on the two Groq-backed generation
  endpoints and the Google-Places-backed Maps discovery endpoint.
- **Prompt-injection framing**: scraped, attacker-influenceable text
  (lead bios) explicitly marked as data-not-instructions in the system
  prompt that consumes it.
- **Dependency**: `nodemailer` upgraded past 12 published CVEs including
  SMTP command injection and SSRF-via-`raw`-option — verified the app's
  actual usage (`createTransport` + `sendMail` with `to/from/subject/text`
  only) doesn't rely on any of the specifically-vulnerable code paths, but
  upgraded anyway since the fix carries no compatibility risk for this
  usage.

## Tests run after each change
No automated test suite exists (see `PRE_HARDENING_STATUS.md`). Every
change in this pass was verified with:
1. `npx tsc --noEmit` — must be clean.
2. `npm run build` — full production build must succeed.
3. Manual trace of the changed logic against the specific exploit
   scenario the fix closes (e.g., for C1: re-read both routes end-to-end
   confirming the client-supplied `plan` field is never read anywhere in
   the grant path anymore).
4. For database migrations: `supabase db push --dry-run` first, applied
   only after confirming exactly the intended migration(s) — and only
   those — were pending; then queried the live schema directly
   (`pg_proc`, `pg_tables`) to confirm the function/tables exist as
   written, not just that the push command exited 0.

No live penetration test (actually attempting the exploit against the
running production app) was performed — see `POST_HARDENING_TEST_RESULTS.md`
for what "verified" means for each item and what would require that kind
of test to be fully confirmed.

## Deliberately NOT fixed in this pass, with reasoning

- **Next.js 14→15/16 upgrade** (H4 in the audit) — no same-major patch
  exists; a major-version bump on a live app with zero test coverage is
  exactly the kind of change this task's own rules say to flag rather than
  force. See `PRODUCTION_SECURITY_CHECKLIST.md` for the recommended path.
- **`leadsDay`/`dmsHour` server-side enforcement** — lower priority than
  `hashtagsWeek` because no direct external API cost is tied to lead/DM
  counts the way it is to AI-generation calls; left for a follow-up pass.
- **Explicit CSRF tokens** — current mitigations (SameSite=Lax cookies +
  JSON-only bodies) are real but not independently verified against an
  actual cross-origin request in this pass; flagged as a residual risk,
  not claimed fixed.
