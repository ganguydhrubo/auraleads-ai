# Threat Model — AuraLeads AI

## System boundaries

- **Client (browser)**: React app served from Vercel. Treated as fully
  public/untrusted — no proprietary logic lives there. AI system prompts,
  provider API keys (Groq, Google Places, Razorpay, PayPal, Meta,
  Supabase service role), and business-rule enforcement (plan quotas) all
  live server-side in Route Handlers, not in client code.
- **Server (Vercel Route Handlers)**: the trust boundary for every
  business rule. `middleware.ts` only gates page routes (`/app/:path*`,
  `/login`, `/signup`); every `/api/*` route is individually responsible
  for its own auth check via `getSessionWorkspaceId()`. This is a
  deliberate architectural choice (verified, not assumed) — confirmed
  every route except the two documented in `SECURITY_AUDIT.md` (H1)
  actually does this.
- **Database (Supabase Postgres)**: the real authorization boundary for
  data access, via Row Level Security. The app's own server-side checks
  are defense-in-depth on top of RLS, not a substitute for it — a bug in
  a route's own logic should still be contained by RLS.
- **Standalone worker** (`workers/social-worker`): a Playwright process,
  not deployed to Vercel, polls `automation_jobs` and drives a real
  browser using a workspace's own pasted LinkedIn/Instagram session
  cookie. Holds `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS) — this is
  necessary for it to act across workspaces as it processes the shared
  queue, but means a compromised worker host is a full-database-access
  event. It is not deployed by this repo's CI (there isn't one) — it's
  the owner's responsibility to run it somewhere they control.

## Actors

1. **Anonymous internet user** — no account. Should be able to reach:
   landing page, signup, login, `/api/webhooks/*` (with valid provider
   signatures only), `/api/maps/search` (public, free, no cost/data risk
   — see audit L1). Should NOT be able to reach anything requiring a
   session — confirmed true for every route except the two fixed in H1.
2. **Authenticated customer (workspace member)** — should only ever see
   and mutate their own workspace's rows. RLS enforces this at the
   database layer on every workspace-scoped table (verified via the
   generic per-table policy loop in `0001_init.sql` plus per-table checks
   in `DATABASE_SECURITY_AUDIT.md`).
3. **Workspace "admin"** — every signup gets this role for their own
   workspace (`bootstrap_workspace`). This is NOT a trusted/elevated role
   platform-wide — it only ever meant "owns this one workspace," and the
   one place that used to conflate it with platform-wide trust
   (`worker_nodes`) was fixed in an earlier session (see `SECURITY_AUDIT.md`
   M2).
4. **Platform admin** (`platform_admins` table) — the actual trusted
   operator role, a tiny explicit allowlist, separate from workspace role.
5. **Third-party webhook senders** (Meta, Razorpay) — authenticated by
   HMAC signature verification, not by IP or secrecy of the URL.
6. **Connected external accounts acting through AuraLeads** (a
   customer's own Instagram/X/Gmail/LinkedIn) — the app acts with a
   token/cookie the customer explicitly granted; scoped to that one
   customer's own external account, never another customer's.

## Key trust decisions and why

- **Client never sees provider secrets.** Confirmed: Groq, Google Places,
  Razorpay, PayPal, Meta app secrets, and the Supabase service-role key
  only appear in server-side `process.env` reads inside Route Handlers —
  grepped the whole client-bundled tree (`components/`, any
  `"use client"` file) for these variable names; none found outside
  server files.
- **Payments only ever credit the plan the SERVER recorded at
  order-creation time** (fixed this pass — see `SECURITY_AUDIT.md` C1).
  This is the single highest-value trust boundary in the app (it's where
  real money and real product entitlement meet), and it's now enforced
  correctly on both providers.
- **AI-generation cost is bounded by real quotas**, not by hoping the
  React UI is the only caller (H1/H2/H3 fixes).
- **A shared Razorpay account with another business (Ropes)** means this
  app's webhook endpoint receives that business's events too — mitigated
  by tagging every AuraLeads-created order with `notes.product =
  "auraleads"` and silently ignoring anything else, rather than trusting
  "any event on our webhook URL must be ours."

## Residual risks (not closed, tracked in `PRODUCTION_SECURITY_CHECKLIST.md`)

- Next.js 14.x has no patch for 3 known advisories (major-version upgrade
  needed, deliberately not forced — see audit H4).
- No CSRF token (mitigated by defaults, not independently load-tested).
- `leadsDay`/`dmsHour` quotas remain client-side-only.
- No automated test suite to catch regressions from future changes,
  security-motivated or otherwise.
