# AuraLeads AI — Setup Guide

Everything in this app is real (no mock data, no fake integrations) — which
means every feature needs a real account/credential behind it. This guide
walks through getting each one, in the order you'll actually need them.

## 0. What you need before anything works at all

These three are required just to sign up and see the dashboard:

1. **A Supabase project** (free tier is fine)
2. **A Groq API key** (free tier is fine) — for AI hashtag/message generation
3. **A generated encryption key** — for storing LinkedIn/Instagram sessions and Gmail passwords safely

### 1. Supabase

1. Go to [supabase.com](https://supabase.com) → New Project.
2. Once created, go to **Project Settings → API** and copy:
   - `Project URL` → this is `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (click "Reveal") → this is `SUPABASE_SERVICE_ROLE_KEY` (keep this secret — never put it in a `NEXT_PUBLIC_` var or ship it to the browser)
3. Go to the **SQL Editor**, open `supabase/migrations/0001_init.sql` from this repo, paste its full contents, and click Run. Repeat for `0002_conversation_metadata.sql` and `0003_gmail_secrets.sql`, **in that numeric order**.
4. That's it — every table, RLS policy, and the `bootstrap_workspace` function used at signup now exist.

### 2. Groq

1. Go to [console.groq.com](https://console.groq.com) → API Keys → Create.
2. Copy it into `GROQ_API_KEY`.

### 3. Encryption key

Run this once and save the output:
```
openssl rand -hex 32
```
Put it in `SESSION_ENCRYPTION_KEY`. **You'll need to paste this exact same value into the worker's `.env` too** (step 6) — they must match.

### 4. Put it all together

Copy `.env.example` to `.env.local`, fill in the three things above. Run:
```
npm install
npm run dev
```
Visit `localhost:3000`, click **Start Free Trial**, sign up, and you'll land in a completely empty (real, no demo data) workspace.

---

## 1. Deploying to production (Vercel)

1. Push this repo to GitHub, import it into Vercel.
2. In Vercel → Project Settings → Environment Variables, add every variable from `.env.example` that you've filled in so far (Supabase x3, Groq, encryption key).
3. Deploy. `/login`, `/signup`, and everything under `/app` are dynamically rendered per-request (not statically cached), so they'll immediately reflect real signed-in state.

---

## 2. Instagram (official Graph API — for real-time inbound DMs + AI auto-replies)

This connects the **legitimate** half of Instagram messaging: replying to
people who've already messaged you. It does **not** do cold outreach —
Instagram's API has no endpoint for that (see part 4 for the real way).

1. Go to [developers.facebook.com](https://developers.facebook.com) → My Apps → Create App → type "Business".
2. Add the **Instagram** and **Messenger** products to the app.
3. Under **Instagram → API Setup with Instagram Login** (or via a connected Facebook Page), connect your Instagram Business/Creator account, and generate a **long-lived Page Access Token** with the `instagram_manage_messages` and `pages_show_list` scopes.
4. Copy your App ID and App Secret from **App Settings → Basic**. Put the App Secret in `META_APP_SECRET`.
5. In the app, go to **Settings → Official APIs → Instagram Messaging**, paste your App ID / App Secret / Page Access Token, click **Verify & Connect**.
6. Back in the Meta App Dashboard → Webhooks → Instagram → Subscribe, set:
   - Callback URL: `https://<your-domain>/api/webhooks/instagram`
   - Verify Token: whatever you set `META_VERIFY_TOKEN` to (default `auraleads_wh_token_88921`)
   - Subscribe to the `messages` field.

Inbound DMs now land in your Unified Inbox in real time, and AI auto-replies
(configured in Inbox → AI Auto-Reply Rules) send back through the same
official Send API — only within Meta's messaging window, which is the real
constraint, not a bug.

---

## 3. WhatsApp Business (official Cloud API)

1. In the same Meta App from step 2, add the **WhatsApp** product.
2. Meta gives you a test phone number immediately — copy its **Phone Number ID** and **WhatsApp Business Account ID**, and generate a **permanent access token** (System Users → generate token with `whatsapp_business_messaging` scope).
3. In the app, go to **Settings → Official APIs → WhatsApp**, paste those three values, click **Verify & Connect**.
4. In the Meta Dashboard → WhatsApp → Configuration → Webhook, set:
   - Callback URL: `https://<your-domain>/api/webhooks/whatsapp`
   - Verify Token: same `META_VERIFY_TOKEN` as above
   - Subscribe to `messages`.

Note: WhatsApp only allows free-form replies within 24 hours of the
customer's last message — outside that window Meta requires a pre-approved
message template, which isn't built here (a real platform rule, not a gap).

---

## 4. X (Twitter)

1. Go to [developer.x.com](https://developer.x.com), create a Project + App.
2. Under your App → **Keys and Tokens**, generate: API Key & Secret, and (separately) an Access Token & Secret with **Read and Write** permission for your own account.
3. In the app, go to **Settings → Official APIs → X**, paste all four, click **Verify & Connect**.

DM sending requires your developer account to have DM permissions at your
current API tier — if X's API rejects it, the app surfaces X's real error
message rather than pretending it worked.

---

## 5. PayPal (real checkout)

1. Go to [developer.paypal.com](https://developer.paypal.com) → Apps & Credentials. Use **Sandbox** while testing, **Live** when you're ready to take real payments.
2. Copy the Client ID and Secret into `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET`. Set `PAYPAL_ENV=live` only when using live credentials.
3. Billing → pick a plan → you'll be redirected to PayPal's real hosted checkout, and redirected back once you approve payment.

---

## 6. LinkedIn & Instagram cold outreach (browser automation worker)

**Read this part carefully — it's the one piece that isn't a supported
integration.** Neither LinkedIn nor Instagram offer a public API for cold
discovery/outreach (LinkedIn has none at all; Instagram's Hashtag Search API
deliberately excludes post authors). The only way to actually do this is to
automate a real browser using your own logged-in session — which is what
tools like PhantomBuster, Expandi, and Dux-Soup do too. **This is outside
both platforms' Terms of Service and can get an account temporarily
restricted; keep volumes low (defaults: 20 connections/day, 30 messages/day).**

1. Deploy the worker in `/workers/social-worker` **somewhere other than
   Vercel** — Railway or Render are easiest (Playwright needs a persistent
   process, which serverless can't provide). Full instructions are in
   `workers/social-worker/README.md`.
2. Set its env vars: same `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` as the
   main app, and the **exact same** `SESSION_ENCRYPTION_KEY`.
3. In the main app, go to **Settings → Browser Automation**:
   - **LinkedIn**: open linkedin.com in your own browser, log in normally, open DevTools → Application → Cookies → `linkedin.com`, copy the `li_at` cookie's value, paste it in and save.
   - **Instagram**: same idea, from instagram.com's `sessionid` cookie.
4. Now "Start Lead Generation" (Hashtag Leads) and "Dispatch DM" buttons queue real jobs the worker picks up and runs — watch them in **Admin → Automation Job Queue**.

---

## 7. Gmail (cold email sending)

1. Turn on 2-Step Verification on the Gmail account you want to send from.
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords), generate an App Password.
3. In the app, go to **Settings → Official APIs → Connected Gmail Accounts**, enter the email + that 16-character App Password. It does a real SMTP login test before saving — wrong password fails immediately rather than pretending to connect.

---

## Quick reference: what's real vs. what requires your own setup

| Feature | Status |
|---|---|
| Auth, database, all 15 views | Real, backed by Postgres — works the moment you complete step 0 |
| Google Maps / OpenStreetMap discovery | Real, no API key needed, works out of the box |
| AI hashtag/message generation | Real, needs `GROQ_API_KEY` |
| Instagram inbound DMs + AI auto-reply | Real, needs Meta setup (§2) |
| WhatsApp messaging | Real, needs Meta setup (§3) |
| X DMs | Real, needs your own X developer keys (§4) |
| PayPal billing | Real, needs PayPal app credentials (§5) |
| LinkedIn / Instagram cold outreach | Real, but unofficial — needs the separate worker deployed (§6) and carries account-ban risk |
| Gmail sending | Real, needs an App Password (§7) |
