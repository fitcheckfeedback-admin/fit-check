# FIT Check Pro: Deal Finder + Smart Packing + Sponsored Slots

Built 2026-09-30. Order per Joshua: (1) deal finder, (2) trip packing upgrade, (3) sponsored plumbing.

## 1. Deal Finder (Pro) — `POST /api/ai/deals`

- App sends `{ deviceId?, rcUserId?, query, context? }` where context is the
  existing AiChatContext (closet, style, gender, weather).
- Server gates with `requirePro`:
  1. `deviceId` in `premium_access` table (web/Stripe purchases, manual grants), OR
  2. `rcUserId` verified live against RevenueCat REST API
     (`GET /v1/subscribers/{id}`, entitlement `pro` not expired), cached 1h.
     Needs `REVENUECAT_SECRET_KEY` in Railway env.
  3. Else `403 { error: "pro_required" }`.
- Rate limit: 5 deal searches / device / day (`deal_search_usage`), env
  `DEAL_DAILY_LIMIT`. At ~$0.02/search this caps worst-case cost well under the
  $2.99/mo Pro price.
- Web search via OpenAI Responses API `web_search` tool (SDK 6.x supports it).
  If the AI proxy doesn't support `/v1/responses`, the endpoint returns a clean
  `502 { error: "web_search_unavailable" }` — no silent garbage. Fallback option
  later: Tavily/Serper key.
- Model must return JSON `{ summary, deals: [{name, brand, price, url,
  retailer, why}] }`; parsed defensively, entries require valid http(s) URLs.
  Parse failure still returns the raw text summary with zero deals.
- Affiliate: env `AFFILIATE_TAGS` = JSON `{"amazon.com":"tag=xxx-20"}` —
  backend appends the tag to matching deal URLs.
- Surfaced in: StylistChat "Find deals" button, VoiceAssistant deal intents
  ("find me deals on…", "cheapest …", "where can I buy …"), Trip packing
  "complementing items".

## 2. Trip Packing Upgrade (Pro, client-side)

- `buildSmartPackingList(days, closet, style, gender)`: derives weather needs
  (cold/rain/heat/wind) from the destination forecast, matches owned items by
  category keywords, and splits each section into owned vs missing.
- "Complementing items" = missing essentials, each with a "Find deals" button
  that runs the deals endpoint inline and renders results.

## 3. Sponsored Slots

- Tables: `sponsored_products` (brand, name, price, category, image_url, url,
  is_active, priority), `sponsored_clicks` (product_id, device_id, created_at).
- `GET /api/sponsored?category=` (public), `POST /api/sponsored/click`
  (public), admin `POST/PATCH/DELETE /api/sponsored` behind the existing
  `ANALYTICS_PASSWORD` Bearer token (same pattern as premium.ts).
- Every paid placement renders a visible "Sponsored" badge (FTC).
- Sponsored products matching the query category are blended at the top of
  deal results; also shown as a "Featured" row in Discover's Shop the Gap.
- Brand BD (actually selling placements) is Joshua's work — the API gives him
  click counts to show brands.

## Schema migrations

No migrate-on-boot exists in api-server and there's no local DATABASE_URL, so
new tables are created idempotently at boot via `ensureTables()` DDL
(`CREATE TABLE IF NOT EXISTS`). Drizzle schema defs in `lib/db/src/schema/`
stay the typed source of truth.

## Joshua setup steps (after deploy)

1. RevenueCat dashboard → API keys → copy the **Secret** key → Railway
   `fit-check-api` → Variables → `REVENUECAT_SECRET_KEY=<key>`. Until then,
   native Pro can't be server-verified (web/manual grants still work).
2. Optional: `AFFILIATE_TAGS` JSON when affiliate IDs exist.
3. Add sponsored products via the admin endpoints (curl examples below).

### Sponsored admin examples

TOKEN=$(node -e "console.log(require('crypto').createHmac('sha256',process.env.SESSION_SECRET).update(process.env.ANALYTICS_PASSWORD).digest('hex'))")
# (key = SESSION_SECRET, message = ANALYTICS_PASSWORD — same as premium.ts getToken())

curl -X POST https://api-production-9e7ca.up.railway.app/api/sponsored \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"brand":"Example","name":"Everyday Jean","price":"$49","category":"bottoms","url":"https://example.com/jean"}'
