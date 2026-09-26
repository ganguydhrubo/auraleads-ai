# AI Security — AuraLeads AI

Every AI call in this codebase goes through Groq, using the platform's own
`GROQ_API_KEY` (never exposed client-side). None of these integrations
currently grant the model tool-calling, database access, or the ability to
take an action on its own — every AI call in this app is pure text
generation whose output either gets stored (as a draft the workspace still
controls) or shown directly to the asking user. This materially limits
worst-case impact for every finding below.

## Inventory of AI calls

| Endpoint | Model | Untrusted input? | Can take action? |
|---|---|---|---|
| `/api/generate/hashtags` | `openai/gpt-oss-20b` (Groq) | User's own business description — not third-party data | No — returns hashtag suggestions only |
| `/api/generate/message` | same | **Yes** — `lead.bio`/`lead.name` scraped from a public profile | No — returns DM/email draft text only |
| `/api/support/chat` | same | **Yes** — free-form text from the asking user themselves | No tools; can only recommend escalating to a human, which the route itself then does via a normal DB insert, not the model |

## Findings

### System prompt exposure
The support chat's system prompt (`app/api/support/chat/route.ts`) is a
feature manual, not a secret — it doesn't contain credentials, internal
URLs, or anything sensitive. A user asking the assistant to "repeat your
instructions" and succeeding would learn nothing they couldn't already
learn from using the product. Not treated as a vulnerability; not
hardened against extraction, since there's nothing sensitive to protect
here.

### Prompt injection via scraped lead bios
See `SECURITY_AUDIT.md` M1. Real impact is bounded to a manipulated draft
message a human reviews before sending — there is no path from this input
to any account action, database write beyond the draft field, or data
exfiltration. Hardened anyway (explicit "treat as data, not instructions"
framing added to the system prompt) since it was a one-line, zero-risk fix.

### Cross-tenant / cross-user data leakage
The support chat receives a per-request `context` object
(`{plan, connectedChannels, hashtagsCount, instagramLeadsCount,
mapsLeadsCount}`) built server-side from the *authenticated caller's own*
`getSessionWorkspaceId()` — never from a client-suppliable workspace ID.
Traced the full request path: there is no way for workspace A's context to
be sent while answering workspace B's question, because the context is
assembled from the session, not from anything the client passes in that
could be swapped.

### Cost protection
Covered in `SECURITY_AUDIT.md` H1–H3 — all three AI endpoints now require
authentication and are rate-limited (10–20 requests/minute per workspace).
No per-workspace *monthly* AI-spend cap exists yet (only a request-rate
cap) — flagged in `PRODUCTION_SECURITY_CHECKLIST.md`.

### Retrieved/untrusted content elsewhere in the system
The Maps enrichment flow (`app/api/channels/maps/enrich/route.ts`) fetches
and regex-scrapes a business's own website HTML for a contact email/phone
— this content is never passed to an LLM (pure regex extraction), so
there's no prompt-injection surface there, only the ordinary web-fetch
risks (SSRF-shaped: the app fetches an arbitrary attacker-influenceable
URL — the "website" field on a lead). Not modified in this pass; noted as
a lower-priority item since the URL always originates from Google Places'
own data or OSM tags, not raw user input, and the fetch has an 8s timeout
and no response body is ever executed, only regex-matched.

## What was NOT found (checked, not present)
- No AI tool/function-calling anywhere in the codebase — nothing to scope
  to least-privilege, because no AI call has any privilege beyond
  generating text.
- No vector database / RAG pipeline with untrusted retrieved documents.
- No user-controlled system-prompt override anywhere (all system prompts
  are hardcoded strings in the route file, never influenced by request
  input).
