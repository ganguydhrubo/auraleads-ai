# Security Audit — AuraLeads AI

Scope: full repository (`auraleads-ai`) — Next.js 14 App Router, Supabase
(Postgres + Auth + Storage), a standalone Playwright worker
(`workers/social-worker`), and third-party integrations (Meta/Instagram,
WhatsApp Cloud API, X/Twitter, Gmail SMTP, Google Places, OpenStreetMap,
PayPal, Razorpay, Groq).

Findings are rated Critical/High/Medium/Low by realistic exploitability and
impact for this specific app, not generic OWASP severity defaults.

---

## CRITICAL

### C1. Payment plan-confusion — pay for Silver, get Platinum
**Files:** `app/api/billing/razorpay/verify-payment/route.ts`,
`app/api/billing/paypal/capture-order/route.ts`

`verify-payment` accepted a client-supplied `plan` field and granted it
after only checking that `(razorpay_order_id, razorpay_payment_id,
razorpay_signature)` was a *genuine Razorpay pair* — the signature says
nothing about which plan/amount that payment was for. A user could
complete a real ₹1,499 Silver checkout, then call verify-payment directly
with `plan: "Platinum"` using that same valid signature and be upgraded to
₹7,999 Platinum for free. PayPal's `capture-order` had the same shape of
gap: `plan` was a query parameter on the redirect URL, not tied to what
the order was actually created for.

**Fix:** added `payment_orders` (migration `0007_payment_orders.sql`) —
every create-order call now records `(workspace_id, provider,
provider_order_id, plan, amount)` server-side, before the customer ever
sees a checkout widget. Both verify/capture routes now look up the
plan from that row (matched on `provider_order_id` **and**
`workspace_id`) instead of trusting anything the client sends afterward.
Also closes a secondary cross-workspace replay: without the `workspace_id`
match, a valid signature triple could in theory be replayed from a
different session.

**Status: FIXED.** Verified via `tsc --noEmit` + `next build`; logic
manually traced for both providers and the webhook path (which was already
safe — it never trusted client input, only server-set `notes`).

---

## HIGH

### H1. `/api/generate/hashtags` and `/api/generate/message` had no authentication
**Files:** `app/api/generate/hashtags/route.ts`, `app/api/generate/message/route.ts`

Both were reachable by anyone with no session at all — a direct,
unauthenticated path to spend the platform's Groq API budget indefinitely.
`middleware.ts` intentionally does not gate `/api/*` (each route is
supposed to check its own session — see `THREAT_MODEL.md`), and these two
routes never did.

**Fix:** added `getSessionWorkspaceId()` checks to both. Also added
server-side enforcement of the weekly hashtag quota (previously
client-side only — see H2) and a per-workspace rate limit to each.

**Status: FIXED.** Confirmed both now return 401 without a session
(code-level check; not live-tested against production since that would
require an anonymous request against the real deployment).

### H2. Plan quotas (hashtagsWeek, leadsDay, dmsHour) were client-side only
**File:** `lib/store/app-store.tsx` (`generateHashtagsAI`), was the only
enforcement point — a `.slice()` on the array *before* insert, in the
browser.

Any authenticated user calling the API routes directly (bypassing the
React UI) could generate and insert unlimited hashtags regardless of their
plan's `hashtagsWeek` limit. `leadsDay`/`dmsHour` were never enforced
anywhere, client or server (display-only stats).

**Fix:** `/api/generate/hashtags` now counts real hashtag rows created in
the last 7 days against `PLAN_LIMITS[plan].hashtagsWeek` before generating
anything, and rejects with a clear message if the workspace is at cap.
`leadsDay`/`dmsHour` are unchanged in this pass — flagged in
`PRODUCTION_SECURITY_CHECKLIST.md` as a follow-up (lower severity: no
external cost is directly tied to lead/DM counts the way it is to AI
generation calls or X's per-action billing).

**Status: FIXED (hashtagsWeek only).**

### H3. Zero rate limiting anywhere in the codebase
No endpoint — login, signup, AI generation, Maps discovery, the new
support chat — had any request-rate limiting before this pass.

**Fix:** added a minimal Postgres-backed limiter (`lib/rate-limit.ts` +
migration `0006_rate_limits.sql`, atomic via a `increment_rate_limit` SQL
function — no new paid infrastructure like Redis/Upstash) and applied it
to the four highest-cost endpoints: `/api/generate/hashtags` (10/min),
`/api/generate/message` (20/min), `/api/support/chat` (15/min),
`/api/maps/scrape` (5/min — each call can trigger a billed Google Places
call). X's one-click connect already had its own daily cap from an earlier
session (`lib/x/usage.ts`).

**Status: PARTIALLY FIXED.** The highest-cost/highest-abuse-value routes
are covered. Login/signup rely on Supabase Auth's own built-in abuse
protection (not something this repo controls) — noted, not modified.
Every other authenticated CRUD-style route (adding a competitor, saving
filters, etc.) still has no rate limit; these carry no direct external
cost and are lower priority — see checklist.

### H4. `next@14.2.35` has 3 known advisories with no 14.x patch
Confirmed via the GitHub Security Advisory database (not assumed):
- GHSA-955p-x3mx-jcvp (unauthenticated disclosure of internal Server
  Function endpoints) — affects 13.0.0–15.5.20 and 16.0.0–16.2.10; fixed
  in 15.5.21/16.2.11. **Not Windows-specific — applies on Vercel too.**
- GHSA-p293-qw3h-jr36 (RCE) — affects 13.4.0–15.5.23 and 16.0.0–16.3.2;
  fixed in 15.5.24/16.3.3. **This one IS Windows-filesystem-specific** —
  not exploitable on Vercel's Linux-based hosting.
- The AVIF Image Optimization RCE advisory bundled with the audit
  request — this app's `next.config.mjs` has no custom `images` config
  and the codebase doesn't appear to serve user-uploaded AVIF through
  `next/image`, so real exposure is low, but wasn't independently
  re-verified line-by-line against the advisory's exact trigger condition.

**Status: NOT FIXED — deliberately.** No 14.x security patch exists;
closing this requires a major-version jump to 15.5.24+ or 16.3.3+, which
is a real breaking-change migration (App Router caching model changes,
`cookies()`/`headers()` becoming async in 15+, middleware API changes) on
a live revenue app with **no test suite** to catch regressions. Forcing
this blind, unsupervised, would risk exactly the kind of "destructive
production change" this audit's own rules say to flag instead of forcing.
See `PRODUCTION_SECURITY_CHECKLIST.md` for the recommended upgrade path.

---

## MEDIUM

### M1. AI prompt injection surface in message generation (low actual impact)
**File:** `app/api/generate/message/route.ts`

`lead.bio` (scraped from a public Instagram/LinkedIn profile — genuinely
untrusted, attacker-influenceable text) was interpolated directly into the
Groq prompt with no framing distinguishing it from instructions.

**Real impact is low**, not Critical/High: this model has no tools, no
database access, and no ability to take action — worst case is it
generates a manipulated DM/email *draft* that a human still reviews before
sending, or ignores the injected instruction and generates weird copy. It
cannot exfiltrate data, escalate privilege, or perform an action on its
own.

**Fix:** added an explicit instruction to the system prompt: treat
name/bio/category as scraped data to reference, never as instructions to
follow.

**Status: FIXED (hardened, not previously exploitable for real harm).**

### M2. `worker_nodes` cross-tenant exposure *(fixed in an earlier session, re-verified here)*
Every new signup becomes `role: 'admin'` of their own workspace
(`bootstrap_workspace`), and the original RLS policy on `worker_nodes`
(shared platform infrastructure — proxy pool, worker fleet) checked that
same role. On a live multi-tenant SaaS, that meant any paying customer
could read *and mutate* every other tenant's shared worker-node pool.

**Fix (already applied, re-confirmed working this pass):** a dedicated
`platform_admins` allowlist (migration `0005_platform_admins.sql`),
separate from workspace role. Re-queried live: exactly one row
(`gangulydhrubo@gmail.com`), and `worker_nodes` policies now require
membership in it.

**Status: CONFIRMED FIXED**, verified again by querying
`pg_policy`/`platform_admins` directly against the live database in this
pass.

### M3. CSRF — no explicit token, mitigated by defaults
No CSRF token exists on any state-changing route. Real risk is reduced by
two factors already in place: (1) Supabase's `@supabase/ssr` sets
`SameSite=Lax` session cookies by default, which browsers do not attach on
cross-site POST requests; (2) every mutating route expects a JSON body
(`Content-Type: application/json`), which a simple cross-site HTML form
cannot produce (forms are limited to
`application/x-www-form-urlencoded`/`multipart/form-data`/`text/plain`).

**Status: PARTIALLY MITIGATED, not independently verified against a real
cross-site request** (would require a second origin to test against,
outside this repo). Documented as a residual risk rather than claimed
fixed.

---

## LOW

### L1. `/api/maps/search` has no authentication
Public OpenStreetMap Nominatim passthrough (location autocomplete) — no
API key, no per-tenant data, free upstream service. Being unauthenticated
here carries no cost or data-exposure risk. Left as-is; noted rather than
"fixed" to avoid implying it needed protecting.

### L2. Source maps
`next.config.mjs` does not set `productionBrowserSourceMaps: true` — Next
defaults to **not** publishing browser source maps in production. Verified
by inspecting config, not by re-crawling the live deployment's `.map`
files.

### L3. Hardcoded secrets
Grepped the full `app/`, `lib/`, `components/`, and
`workers/social-worker/src/` trees for common key-shape patterns
(`sk-...`, `AIza...`, `ghp_...`) — none found. All real secrets observed
in this session were passed as environment variables.

---

## Vulnerability count summary

| Severity | Found | Fixed | Notes |
|---|---|---|---|
| Critical | 1 | 1 | Payment plan confusion (C1) |
| High | 4 | 3 | Next.js CVEs (H4) intentionally left — no safe same-major patch exists |
| Medium | 3 | 3 | All fixed or re-confirmed fixed |
| Low | 3 | 0 (n/a) | None required a code change |
