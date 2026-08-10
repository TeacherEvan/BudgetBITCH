# LINE Receipt-Bot Integration — Design

> Status: **DESIGN (assumption-based)**. The bot's external source was not provided;
> this design is drafted against an assumed shape and must be corrected against the
> real bot code before production wiring. Open items are flagged `OPEN`.

## 1. Problem

Budget Boss (this repo) already scrapes receipts two ways inside the Next.js app:
- **Scraper-bot** (`convex/receipts.ts` `scrape` mutation + `convex/lib/receipt/engine`): OCR text from tesseract.js → deterministic extractor → draft → confirm.
- **Gemini vision** (`convex/receipts.ts` `parseReceipt` action): base64 image → Gemini 2.5 Flash → JSON, persisted via `internal.receipts.saveReceipt`.

The user also runs a Hugging Face–hosted LINE bot (external, outside this tree). Goal: let a user send a receipt **photo in the LINE chat** and have it ingested into the **same `receipts` table** the web app reads, under the correct Convex `userId`.

## 2. Non-negotiables (from existing repo)

- Receipt rows are guarded by `getAuthUserId(ctx)` (`convex/lib/auth.ts`); every mutation requires a resolved Convex identity.
- `parseReceipt` is an `action` that calls `ctx.runMutation(internal.receipts.saveReceipt, …)` — so the persistence path already exists and is reusable.
- Auth is Convex Auth (Password/Email), `convex/auth.ts`. There is **no** LINE/LIFF provider wired (`convex/http.ts` only mounts `auth.addHttpRoutes`).
- Both `scrape` and `parseReceipt` reject when `getAuthUserId` is null. A LINE webhook is server-to-server (LINE → Convex) and has **no** user session, so it cannot rely on `ctx.auth`.

## 3. Architecture (assumed shape — LIFF-authed, image → parseReceipt)

```
LINE chat ──image message──▶ LINE platform
LINE platform ──POST /line/webhook (HMAC-signed)──▶ Convex httpAction
  1. verify x-line-signature (HMAC-SHA256 over raw body with LINE_CHANNEL_SECRET)
  2. parse event; for image message, GET image bytes from LINE content API
     (Bearer LINE_CHANNEL_ACCESS_TOKEN) → base64
  3. look up Convex userId via lineUsers table (key: event.source.userId)
  4. ctx.runAction(internal.line.parseLineReceipt, { userId, base64Image })
       → reuses validateAmount/validateMerchant/normalizeCategory/validateDate
       → ctx.runMutation(internal.receipts.saveReceipt, { …, source: "line" })
  5. reply to chat via LINE Reply API (optional, OPEN: final copy TBD)
```

**Identity bridge (the only safe model):** a mapping table `lineUsers { lineUserId, userId, accountId?, linkedAt }`.
- Linking is done from the **web app** (already authenticated as the Convex user) via a `linkLineAccount(lineUserId, accountId?)` mutation. The LINE userId is obtained client-side through LIFF (`liff.getProfile().userId`) and POSTed over the existing authenticated session.
- The webhook never mints a Convex identity; it only *resolves* a pre-linked mapping. This keeps `getAuthUserId`-style authorization intact and avoids forging sessions.

**Why reuse `parseReceipt` path instead of `scrape`:** the bot receives an *image*, not OCR text. The scraper-bot path needs `OcrPayload` (tesseract output). Running tesseract server-side is out of scope; Gemini vision already ingests images and produces the same validated fields. So LINE images flow through the Gemini path, tagged `source: "line"`.

## 4. New surfaces

| Surface | File | Kind | Purpose |
|---|---|---|---|
| `lineUsers` table | `convex/schema.ts` | schema | LINE→Convex id mapping (index `by_lineUserId`) |
| `source` field | `convex/schema.ts` | schema | tag receipts `"line"` vs `"app"` (default `"app"`) |
| `convex/lib/line/verify.ts` | new | pure util | `verifyLineSignature(body, sig, secret)` |
| `convex/lib/line/types.ts` | new | types | `LineWebhookEvent`, `LineMessageEvent` |
| `convex/line.ts` | new | mutation+internal action | `linkLineAccount`, `parseLineReceipt` (internal), `getConvexUserByLineId` (internal) |
| `convex/http.ts` | modify | http route | `POST /line/webhook` → `lineWebhook` httpAction |
| `src/app/settings/line-link/page.tsx` | new | UI | LIFF link screen (calls `linkLineAccount`) |
| `src/hooks/use-line-link.ts` | new | hook | LIFF init + `linkLineAccount` |

## 5. OPEN items (improve / correct against real bot)

1. **Exact bot host & event shape.** Assumed LINE Messaging API webhook. If it is a custom HF bot proxy, the webhook contract changes.
2. **Reply copy.** What should the bot say back? Open: `"Receipt saved: ฿X at Merchant"` vs a confirmation link.
3. **Multi-account.** `accountId` optional; default to user's primary account.
4. **LIFF channel.** Needs `NEXT_PUBLIC_LINE_LIFF_ID` + a LINE Login channel; not yet provisioned.
5. **Rate limits / large images.** LINE content API images can be large; cap size before base64 (OPEN: 5MB guard).

## 6. Security

- `LINE_CHANNEL_SECRET` + `LINE_CHANNEL_ACCESS_TOKEN` are Convex env vars (names only; never committed).
- Signature verified on **every** webhook request before any DB work.
- Webhook returns 200 even on non-image events (LINE retries on non-2xx); only image+linked-user paths touch the DB.
- No user-supplied `userId` is ever trusted; the mapping is the only bridge.
