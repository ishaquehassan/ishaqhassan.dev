# Build a Personal Portfolio AI Bot — Complete Spec

> Paste this entire document into Claude / ChatGPT / Cursor as a single prompt. The model will scaffold the full system. Replace `OWNER_NAME`, `OWNER_DOMAIN`, `OWNER_EMAIL`, and content sections with your own data.

---

## Goal

Build an interactive AI chatbot embedded on a personal portfolio site (think macOS-style desktop). The bot answers questions about the owner (skills, experience, OSS work, articles, courses), recommends content via rich cards (videos, articles, projects), captures hire/collab leads via inline forms, and emails leads to the owner. Must work globally including Pakistan/India (geo-blocked regions for OpenAI/Gemini), on Cloudflare Workers free tier, with hardened abuse mitigation.

Reference site: `https://ishaqhassan.dev` (talk to "Max" via the bottom dock pill).

---

## Stack (Non-negotiable choices, with reasons)

| Layer | Choice | Reason |
|---|---|---|
| Edge runtime | **Cloudflare Workers (free tier)** | $0/mo, global edge, 100k req/day free |
| LLM provider | **OpenRouter** | Single API → many models, cheap |
| Model | **`deepseek/deepseek-chat`** (~$0.14/M in + $0.28/M out) | Cheap, instruction-following, **works from PK/IN colos** |
| Email | **Resend** (free 3k/mo) | Reliable, simple API, custom domain support |
| Rate limiting | **CF Workers Rate-Limit bindings** (free) | Distributed across colos, can't bypass |
| Frontend | **Vanilla JS + CSS** (no framework) | Embeds in any portfolio without bloat |
| Domain email | **Cloudflare Email Routing** | Free `hello@yourdomain.com` → personal Gmail |

### Why NOT OpenAI / Gemini direct
OpenAI and Google geo-block Pakistan/India from many tiers. Cloudflare Workers free tier has NO Smart Placement — worker egress always originates from the user's nearest colo. So a PK visitor → PK colo → OpenAI returns 403. OpenRouter sidesteps this for open-weight models served by providers without geo restrictions (DeepSeek, Llama via Together/Fireworks, Qwen, Mistral). Use **DeepSeek Chat** as the primary; do NOT add a fallback cascade — one good model > flaky multi-model logic.

---

## Architecture

```
[Visitor browser]
      │
      ▼  (POST /chat)
[Cloudflare Worker: max-bot.YOURNAME.workers.dev]
      │
      ├─→ CORS check (regex: yourdomain.com + localhost:* allowed)
      ├─→ Rate-limit binding check (BURST 8/10s, MIN 40/60s)
      ├─→ Circuit breaker (300 chats/min global → 503)
      ├─→ Payload caps (Content-Length ≤16KB, history ≤18KB, msg ≤1200 chars)
      ├─→ Build system prompt + history
      ├─→ Fetch OpenRouter (deepseek/deepseek-chat)
      ├─→ Scrub forbidden chars (em-dash → period)
      ├─→ Detect [[FORM:*]] / [[CARDS:*]] / lead JSON
      └─→ Return reply
      
      │
      └─→ POST /notify (when user submits lead form)
          │
          ├─→ Rate-limit binding (NOTIFY_RL: 5/60s)
          ├─→ Send email via Resend → owner's Gmail
          └─→ Return ok
```

### Secrets (set via `wrangler secret put`)
- `OPENROUTER_API_KEY` — primary LLM
- `RESEND_API_KEY` — lead email delivery

### Wrangler config (`wrangler.toml`)
```toml
name = "max-bot"
main = "src/worker.js"
compatibility_date = "2025-04-01"

[vars]
ALLOWED_ORIGINS = "https://yourdomain.com,https://www.yourdomain.com"

# Distributed rate limits (free tier)
[[unsafe.bindings]]
name = "CHAT_RL_BURST"
type = "ratelimit"
namespace_id = "1001"
simple = { limit = 8, period = 10 }

[[unsafe.bindings]]
name = "CHAT_RL_MIN"
type = "ratelimit"
namespace_id = "1002"
simple = { limit = 40, period = 60 }

[[unsafe.bindings]]
name = "NOTIFY_RL"
type = "ratelimit"
namespace_id = "1003"
simple = { limit = 5, period = 60 }
```

---

## Worker (`src/worker.js`) — Required Behaviors

### 1. CORS
- Allow `ALLOWED_ORIGINS` (comma-separated) **plus** any `localhost:*` origin (regex match `^https?://(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$`).
- Reject all others with `403 origin_blocked`.

### 2. Rate limiting (apply IN ORDER)
1. **Hard payload caps** first (cheapest reject):
   - `Content-Length > 16384` → `413 payload_too_large`
   - History total chars > 18000 → `413 history_too_long`
   - Per-message > 1200 chars → `413 message_too_long`
2. **Distributed RL bindings** keyed by IP (`CF-Connecting-IP`):
   - `CHAT_RL_BURST.limit({ key: ip })` → 8 req / 10s
   - `CHAT_RL_MIN.limit({ key: ip })` → 40 req / 60s
3. **In-memory fallback** (`Map<ip, [timestamps]>`) — only if bindings throw.
4. **Global circuit breaker**: track total chat calls per minute; if > 300, return `503 circuit_open` for 30s. Wallet protection from coordinated abuse.

### 3. System prompt structure
Plain text prompt with these sections (in order):

```
You are Max, the AI assistant for OWNER_NAME's portfolio.

# IDENTITY
[Owner one-liner: role, expertise, location]

# RULES
- Reply in the SAME language the user wrote in (English / Urdu / Hindi etc.)
- Be conversational, warm, never robotic
- ONE attribution per technical answer (e.g., "OWNER recommends..."). Vary phrasing
- ONE conversational question per turn during qualification flows (no numbered lists)
- Code answers: emit ```lang fenced blocks (frontend renders IDE-style cards)

# FORBIDDEN CHARACTERS (HARD RULE)
NEVER emit em-dash (—), en-dash (–), or double-hyphen (--) anywhere.
WRONG: "He works in Karachi — Pakistan"
RIGHT: "He works in Karachi. Pakistan."

# CARD TAG SYSTEM (frontend renders these as rich UI cards)
- [[CARDS:contact]]    — show contact channels
- [[CARDS:tech]]       — show tech stack grid
- [[CARDS:speaking]]   — show speaking history
- [[CARDS:oss]]        — show open-source projects
- [[VIDEO:youtube_id]] — embed single video
- [[VIDEOS:id1,id2,id3]] — embed multiple
- [[ARTICLE:slug]]     — show single article card
- [[ARTICLES:s1,s2]]   — show multiple
- [[OSS:slug]]         — show single OSS project

ALWAYS use [[CARDS:tech]] when listing tech stack. Listing items as text is FORBIDDEN.

# LANGUAGE GATE FOR CONTENT
The video/article catalog is OWNER's expertise (e.g. Flutter/Dart). 
DO NOT emit [[VIDEO]] / [[ARTICLE]] tags for unrelated topics 
(e.g. don't suggest a Flutter video on a JavaScript closure question).

# INQUIRY / LEAD FLOW
For ANY hire / speaking / collab / general inquiry intent, emit ONE of:
- [[FORM:hire-fulltime]]
- [[FORM:hire-project]]
- [[FORM:hire-consultancy]]
- [[FORM:speaking]]
- [[FORM:collab]]
- [[FORM:general]]

Frontend renders an inline form. Ambiguous "looking to hire" → default [[FORM:hire-project]].
NEVER respond with a numbered field checklist.
NEVER emit [[CARDS:contact]] alongside a lead JSON or [[FORM:*]] tag.

# CATALOG
[Embed your video catalog with topic tags here]
[Embed your article catalog with slugs + topics here]
[Embed your OSS catalog with slugs + descriptions here]
```

### 4. Post-processing (server-side, after LLM returns)
- `scrubEmDashes(text)`: replace ` — ` (space-mdash-space) with `. ` outside fenced code blocks. Uses Unicode regex `[—–]` — DO NOT use literal char class (regex gets corrupted by future bulk-strip passes).
- Strip `[[CARDS:contact]]` if reply also contains `lead_ready` JSON.

### 5. `/notify` endpoint (lead capture)
- Accepts `{intent, name?, email, message, role?, company?, project_type?, ...}`.
- POSTs to Resend API:
  ```js
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Max (OWNER AI) <hello@yourdomain.com>',
      to: ['your-personal@gmail.com'],
      subject: `New ${intent} lead from ${name || email}`,
      html: prettyLeadHtml(payload)
    })
  });
  ```
- Apply `NOTIFY_RL` (5/60s per IP) to prevent spam.

---

## Frontend (`js/max.js`) — Required Components

### 1. Chat UI shell
- Bottom-right floating dock pill (collapsed) → expands to chat panel.
- Premium pill input bar (textarea + send button INSIDE one rounded container with focus ring).
- Centered narrow column on wide screens via CSS container query (`@container maxchat (min-width: 880px)` → cap content at 760px).
- Auto-scroll to bottom on every render (multi-tick + ResizeObserver + window resize listener).

### 2. Tag detection + rich card rendering
For each bot reply, regex-extract tags BEFORE rendering text:
- `[[CARDS:type]]` → call `renderCardsBlock(type)` (you build a static card component for each type)
- `[[VIDEO:id]]` / `[[VIDEOS:ids]]` → embed YouTube thumbnail cards (`youtu.be/embed/<id>`) opening in-site
- `[[ARTICLE:slug]]` / `[[ARTICLES:slugs]]` → article cards with `siteSlug` mapped to in-site nav (NOT new tab)
- `[[OSS:slug]]` → OSS project card with stars + GitHub link
- `[[FORM:intent]]` → inline `<form class="max-form">` with intent-specific fields

### 3. Inline lead form (`buildInquiryFormHTML(intent)`)
| Intent | Fields (Email + Message ALWAYS required; rest optional) |
|---|---|
| `hire-fulltime` | Role title, Company |
| `hire-project` | Project type (dropdown), Timeline |
| `hire-consultancy` | Area (dropdown) |
| `speaking` | Event name, Date, Format (dropdown) |
| `collab` / `general` | Just Name, Email, Message |

On submit:
1. POST to `/notify` worker endpoint.
2. On success: remove the form's wrap **and every preceding bot text message in the same turn** (the lead-in like "Drop your details below" becomes redundant).
3. Replace with intent-aware confirmation card via `buildInquirySentCardHTML(intent)`.
4. Persist `state.lead` + `state.leadSent` in `sessionStorage` (so success card survives reload).

### 4. Code highlighter (CRITICAL bug to avoid)
For triple-backtick fenced blocks, render IDE-style card with copy button + syntax highlighting. **Do NOT do string-replace passes in order COMMENT → STR → KW → NUM** — the KW regex matches the literal word `class` inside earlier-injected `<span class="cs">…</span>` tags and corrupts HTML. Instead:
1. **Placeholder pass** with non-printable markers (SOH/STX).
2. **NUM pass first** so placeholder index digits don't get re-stashed.
3. Then COMMENT, STR, KW.
4. Final pass: replace placeholders with real spans.

### 5. State persistence (`sessionStorage`)
Keep entire conversation + UI state in `sessionStorage` so reload preserves chat. Key: `max_state_v2`. Version your key when shape changes (handle migration).

---

## Abuse Mitigation Checklist

- [x] Em-dash hard ban (prompt + server scrub)
- [x] Triple validation: payload size → IP RL bindings → global circuit breaker
- [x] Rate limits calibrated 5x normal envelope (genuine humans never trip)
- [x] CORS regex-based with explicit `localhost:*` allowance for dev
- [x] No fallback model cascade (one good model > flaky multi-model)
- [x] Lead form has its own `NOTIFY_RL` (5/60s) separate from chat
- [x] System prompt forbids both numbered field checklists AND duplicate `[[CARDS:contact]]` with lead JSON

---

## Build Order (recommended)

1. **CF account + Workers project**: `npm create cloudflare@latest max-bot`
2. **OpenRouter signup** + create API key, add $5 credit
3. **Resend signup** + verify your domain (DNS records)
4. **Cloudflare Email Routing**: route `hello@yourdomain.com` → personal Gmail
5. **Worker skeleton**: CORS + `/chat` POST + `/notify` POST + secrets via `wrangler secret put`
6. **Add 3 RL bindings** in `wrangler.toml`, deploy, test with Postman
7. **System prompt v1**: identity + rules + forbidden chars (no catalog yet)
8. **Test from Postman**: verify language detection, em-dash scrubbing, RL trips at 9th burst hit
9. **Frontend chat shell**: floating dock pill → expandable panel + textarea + send button
10. **Tag system**: implement `[[CARDS:contact]]` + `[[CARDS:tech]]` first as proof
11. **Catalog**: embed video/article/OSS catalogs in system prompt with topic tags
12. **`[[FORM:*]]` system**: inline form rendering + `/notify` flow + Resend integration
13. **Code highlighter**: placeholder-based pass (avoid the corruption bug above)
14. **Mobile variant**: separate chat shell for mobile (full-screen sheet, not floating panel)
15. **State persistence**: sessionStorage with versioned key
16. **Test abuse**: hammer with 100 req/sec, verify circuit breaker + RL trip without crashing

---

## Estimated cost (real numbers from production)

- **Cloudflare Workers**: $0 (well within 100k req/day free)
- **OpenRouter (DeepSeek)**: ~$0.50–2.00/month for personal portfolio traffic (~5k chats/mo, 1k tokens avg)
- **Resend**: $0 (within 3k emails/mo free)
- **Domain email**: $0 (Cloudflare Email Routing)
- **Total**: ~$1–3/month for a fully featured AI portfolio bot

---

## Pitfalls I hit so you don't (read these before coding)

1. **Em-dash regex char class**: never write `[—–]` as a literal char class in source. Bulk-strip passes corrupt it to `[. ]` which matches any period or space, mangling every reply with periods between words. Use Unicode escapes: `[—–]`.
2. **Triple-backtick template literal escaping**: writing `` \\\`\\\`\\\` `` in JS template strings produces literal backslashes in the rendered prompt → frontend regex never matches → code rendered as plain text. Just write plain `` ``` ``.
3. **Code highlighter ordering**: NUM must run FIRST in the placeholder pass.
4. **Don't add fallback model cascade**: makes prompt drift across models, hard to debug, and weaker models violate rules in subtle ways. Pick one good model, tune the prompt for it.
5. **Cloudflare Workers free tier has no Smart Placement**: PK/IN visitors → PK/IN colo → OpenAI/Gemini geo-block. DeepSeek via OpenRouter works from these regions.
6. **Cache-bust ALL changed asset versions in HTML** when shipping a redesign. If `app.min.js?v=142` content changes but query stays at `v=142`, browsers serve stale cached JS that mismatches new HTML → broken layout / silent crashes.

---

## What to give the LLM building this

When you paste this into Claude/Cursor/ChatGPT, ALSO provide:
- Owner identity: name, role, location, key credentials (X PRs merged, Y stars, Z talks)
- Video catalog: list of YouTube video IDs + titles + topics
- Article catalog: list of article slugs + titles + topics
- OSS project list: slugs + descriptions + GitHub URLs
- Visual style preferences (dark/light, accent colors, typography)
- Domain name for CORS + email sender
- Personal email for lead delivery

The LLM can then scaffold the full worker + frontend in one pass.

---

**Done. Ship it.**
