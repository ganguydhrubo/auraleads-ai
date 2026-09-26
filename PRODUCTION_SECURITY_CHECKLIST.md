# Production Security Checklist

Status values: **IMPLEMENTED** (working, verified), **FIXED** (was broken,
now fixed and verified this pass), **PARTIALLY IMPLEMENTED**, **REQUIRES
OWNER ACTION** (needs a credential, dashboard action, or business
decision only the owner can make), **NOT APPLICABLE**.

| Control | Status | Notes |
|---|---|---|
| Authentication on all data-mutating API routes | FIXED | Two routes (`generate/hashtags`, `generate/message`) had none — fixed this pass |
| Tenant isolation (RLS) | IMPLEMENTED | Verified live against the database, zero gaps found — see `DATABASE_SECURITY_AUDIT.md` |
| IDOR/BOLA prevention | FIXED | Payment plan-confusion (C1) was a real IDOR-shaped bug; fixed |
| Webhook signature verification | IMPLEMENTED | Instagram, WhatsApp, Razorpay all use timing-safe HMAC comparison |
| Rate limiting — AI/expensive endpoints | FIXED | 4 highest-cost endpoints now limited; see audit H3 for what's still uncovered |
| Rate limiting — login/signup | NOT APPLICABLE (delegated) | Handled by Supabase Auth itself, outside this repo's control |
| Real server-side plan quota enforcement | PARTIALLY IMPLEMENTED | `hashtagsWeek` fixed; `leadsDay`/`dmsHour` still client-side only |
| Secrets never in client bundle | IMPLEMENTED | Verified by grep across all client-bundled code |
| Secrets never hardcoded in source | IMPLEMENTED | Verified by pattern grep across the repo |
| CORS locked down (no wildcard) | IMPLEMENTED | No CORS headers are set anywhere, meaning the browser's default same-origin policy applies — never explicitly opened up |
| CSRF protection | PARTIALLY IMPLEMENTED | SameSite=Lax cookies + JSON-only bodies mitigate; no explicit token, not live-tested |
| Security headers (CSP, HSTS, etc.) | IMPLEMENTED | Set in `next.config.mjs`, added to in an earlier session (frame-ancestors) |
| Source maps not publicly exposed | IMPLEMENTED | `productionBrowserSourceMaps` not enabled (Next default: off) |
| No debug/test endpoints in production | IMPLEMENTED | Verified by filename search across `app/api` |
| Dependency vulnerabilities — nodemailer | FIXED | Upgraded 6.10.1 → 10.0.10 |
| Dependency vulnerabilities — Next.js | **REQUIRES OWNER ACTION** | See below — no 14.x patch exists |
| AI cost protection | FIXED | See above; no per-workspace *monthly* spend cap yet, only per-minute rate limits |
| AI prompt injection hardening | FIXED | Scraped lead data now explicitly framed as untrusted in the one prompt that consumes it |
| AI tool/agency restrictions | NOT APPLICABLE | No AI call in this codebase has tool-calling or action capability |
| Platform-admin vs. workspace-admin separation | IMPLEMENTED | Fixed in an earlier session (`platform_admins`), re-verified live this pass |
| Automated test suite | **REQUIRES OWNER ACTION** | None exists; every fix in this pass was verified by build/typecheck + manual trace, not regression tests |
| CI/CD secret scanning, SAST | NOT APPLICABLE | No CI/CD pipeline exists in this repo to add it to |

## Owner action required — details

### 1. Next.js major-version upgrade
**Why it's blocked from being done automatically:** no patched release
exists within the 14.x line (confirmed via GitHub Security Advisory
lookups, not assumed). The fix requires 15.5.24+ or 16.3.3+, both major
version jumps with real breaking-change surface (async `cookies()`/
`headers()`, App Router caching model changes, middleware API changes),
on a live revenue app with zero automated test coverage to catch a
regression.

**Recommended path:**
1. Create a separate branch/preview deployment (not `main`, not
   production).
2. Run `npx @next/codemod@canary upgrade latest` (Next's own official
   migration codemod) rather than a manual `npm install`.
3. Manually re-test every integration end-to-end on the preview
   deployment: auth, all channel connections, billing checkout (both
   providers, in test/sandbox mode), Maps discovery, hashtag/message
   generation, the support chat, and the admin console.
4. Only merge to `main` and deploy to production once that pass is clean.

### 2. Rotate the Vercel personal access token and Supabase access token used in this session
Both were shared in plaintext chat during this engagement (for deploying
and for running database migrations). Rotate from:
- Vercel: Account Settings → Tokens
- Supabase: Account → Access Tokens

### 3. Confirm/adjust the rate-limit thresholds
The numbers chosen (10/min hashtags, 20/min message-gen, 15/min support
chat, 5/min Maps) are reasonable defaults sized well above normal UI
usage, not a measured business decision — the owner should confirm these
don't clip a legitimate power-user workflow.

### 4. Decide on a per-workspace monthly AI/API spend cap
Current protection is request-rate limiting, not a spend ceiling. A
workspace calling generation endpoints at exactly the rate limit,
continuously, for a month, would still generate real ongoing Groq/Google
Places cost — a monthly budget cap is a business decision (what's the
right number per plan tier) this repo can't make on its own.
