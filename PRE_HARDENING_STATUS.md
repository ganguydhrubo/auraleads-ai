# Pre-Hardening Baseline Status

Recorded before any security-motivated code change in this pass (some
security fixes had already landed in earlier sessions — worker_nodes RLS,
webhook signature verification, X OAuth PKCE — this baseline is for the
audit that started with the "AUTONOMOUS SECURITY AUDIT" directive).

## Test suite
**None exists.** `package.json` has no `test` script and there are no
`*.test.ts`/`*.spec.ts` files in the app. This is a pre-existing condition,
not something this pass broke — but it means "run tests" throughout this
process means: typecheck + production build + manual/targeted verification
of each fix, not an automated regression suite.

## Lint
No standalone `lint` script, but `next build` runs ESLint as part of its
build step by default (visible in build output as "Linting and checking
validity of types..."). No lint errors at baseline.

## Typecheck
`npx tsc --noEmit` — **PASS**, zero errors.

## Production build
`npm run build` — **PASS**, all routes compiled successfully.

## Dependency audit (`npm audit --omit=dev`)
3 vulnerabilities at baseline: 1 critical, 2 high.

| Package | Severity | Notes |
|---|---|---|
| next@14.2.35 | Critical + High (2 advisories) | No patched release exists in the 14.x line — fix requires 15.5.21+/16.2.11+ or 15.5.24+/16.3.3+. See `SECURITY_HARDENING_REPORT.md`. |
| nodemailer@6.10.1 | High | 12 advisories (SMTP command injection, arbitrary file read via `raw`, SSRF, header injection). Fixed in this pass — upgraded to 10.0.10. |
| postcss (transitive, via next) | High | Resolves automatically once Next.js is upgraded. |

## Known pre-existing functional gaps (not introduced by this pass)
- No rate limiting anywhere in the codebase.
- `hashtagsWeek`/`leadsDay`/`dmsHour` plan quotas were enforced client-side
  only — the API routes never checked them.
- `/api/generate/hashtags` and `/api/generate/message` had no authentication
  at all.
- Razorpay `verify-payment` and PayPal `capture-order` trusted a
  client-supplied `plan`, not tied to what was actually paid for.

These are documented in detail, with fixes, in `SECURITY_AUDIT.md` and
`SECURITY_HARDENING_REPORT.md`.
