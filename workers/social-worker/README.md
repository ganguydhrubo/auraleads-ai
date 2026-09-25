# AuraLeads Social Automation Worker

Runs LinkedIn and Instagram cold-outreach jobs queued by the main app using
your own logged-in browser session for each platform. Neither platform
offers a public API for this (LinkedIn has none at all; Instagram's official
Hashtag Search API deliberately omits post authors), so this drives a real
headless Chromium browser instead.

**This uses your account outside each platform's supported integration path.
Both LinkedIn and Instagram can suspend accounts for automated activity.
Keep volumes low (the built-in daily caps default to 20 connections / 30
messages per day) and expect to occasionally re-paste your session cookie
if a platform logs the session out.**

## Why this can't run on Vercel

Playwright needs a long-lived process and a real Chromium binary — Vercel
serverless functions are short-lived and don't support that. Deploy this
worker separately:

- **Railway / Render**: easiest. Point it at this folder, set the env vars
  below, use `npm run build && npm start` as the start command.
- **A small VPS** (e.g. a $6/mo box): `git clone`, `npm install`, copy `.env`,
  `npm run build`, then run it under `pm2` or a systemd service so it
  restarts on crash/reboot.
- **Your own machine**: `npm install && npm run dev` — fine for testing, but
  jobs stop being picked up when your machine is off.

## Setup

1. `cp .env.example .env` and fill in:
   - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — same Supabase project as the main app (Project Settings → API).
   - `SESSION_ENCRYPTION_KEY` — **must exactly match** the `SESSION_ENCRYPTION_KEY` you set in the main app's environment variables (Vercel). Generate one with `openssl rand -hex 32` and use it in both places.
2. `npm install` (this also downloads a Chromium binary via `playwright install`).
3. `npm run build && npm start` (or `npm run dev` while iterating).

## Connecting your session (done from the main app, not here)

In the app, go to **Settings → LinkedIn / Instagram → Browser Automation**
and paste:
- **LinkedIn**: the `li_at` cookie value from your browser's devtools
  (Application → Cookies → linkedin.com → `li_at`) after logging in normally.
- **Instagram**: the `sessionid` cookie value the same way, from
  instagram.com's cookies.

The app encrypts it and stores it server-side; this worker decrypts it only
in memory when running a job.

## Maintenance note

LinkedIn and Instagram change their DOM/selectors periodically. If jobs
start failing with "button not found" errors, open `src/linkedin.ts` /
`src/instagram.ts` and update the selectors to match the current page — this
is expected upkeep for any tool in this category (same as PhantomBuster,
Expandi, Dux-Soup, etc.).
