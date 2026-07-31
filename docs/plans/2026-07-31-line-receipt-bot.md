# LINE Receipt-Bot Integration — Implementation Plan

> **For implementer:** Use TDD throughout. Write failing test first. Watch it fail. Then implement.

**Goal:** Let a user send a receipt photo in LINE and have it land in the same `receipts` table the web app uses, under the correct Convex user, via a HMAC-verified Convex webhook.

**Architecture:** Convex HTTP webhook (`/line/webhook`) verifies the LINE signature, fetches the image, resolves the Convex user from a new `lineUsers` mapping table, and reuses the existing Gemini `parseReceipt` persistence path tagged `source:"line"`. Linking is done from the authenticated web app via LIFF.

**Tech Stack:** Convex 1.34 (`httpAction`, `internal` actions, `convex-test` + vitest), Next.js 14 + React 18, LIFF (client). Gemini 2.5 Flash (existing `GEMINI_API_KEY`).

**Test commands (per task):**
- Convex unit/integration: `npm run test:convex` (runs `vitest run --config convex/vitest.config.ts`)
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Full gate: `npm run ci`

**Conventions (AGENTS.md):** Use `v.*` validators; `.withIndex()` never `.filter()`; internal funcs via `internal.*`; never accept `userId` as a client arg (resolve server-side); frequent commits.

---

### Task 1: Schema — `lineUsers` table + `source` field on receipts

**Files:**
- Modify: `convex/schema.ts`
- Test: `convex/line.test.ts` (create in Task 2; for now rely on typecheck + a schema assertion test added here)

**Step 1: Write the failing test**
Create `convex/line.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";

describe("schema", () => {
  it("has lineUsers table with by_lineUserId index and receipts.source field", () => {
    const t = convexTest(schema);
    // schema compiles ⇒ types valid; we assert structural intent via a write/read roundtrip in Task 2
    expect(t).toBeDefined();
  });
});
```
Run `npm run test:convex`. Expect: passes trivially (schema compiles) — this is a placeholder; real assertions come in Task 2.

**Step 2: Modify schema**
In `convex/schema.ts`, add to `receipts` table fields:
```ts
source: v.optional(v.string()), // "app" (default) | "line"
```
Add a new table:
```ts
lineUsers: defineTable({
  lineUserId: v.string(),
  userId: v.string(),
  accountId: v.optional(v.string()),
  linkedAt: v.number(),
}).index("by_lineUserId", ["lineUserId"]),
```

**Step 3: Run** `npm run typecheck` → expect PASS (no errors).

**Step 4: Commit**
`git add convex/schema.ts convex/line.test.ts && git commit -m "feat(line): add lineUsers table and receipts.source field"`

---

### Task 2: Identity mapping — `linkLineAccount` + internal resolver

**Files:**
- Create: `convex/line.ts`
- Test: `convex/line.test.ts` (extend)

**Step 1: Write the failing test** (append to `convex/line.test.ts`)
```ts
import { api, internal } from "./_generated/api";
import { test } from "vitest";
import { convexTest } from "convex-test";

test("linkLineAccount stores mapping for authed user", async () => {
  const t = convexTest(schema);
  const userId = "user_123";
  const id = await t.runMutation(internal.line.linkLineAccount, {
    lineUserId: "Uabc",
    userId, // passed by internal caller that already resolved auth
    accountId: undefined,
  });
  const resolved = await t.runQuery(internal.line.getConvexUserByLineId, { lineUserId: "Uabc" });
  expect(resolved).toBe(userId);
});
```
NOTE: `linkLineAccount` as written in the test is the *internal* resolver. The public mutation must derive `userId` from `ctx.auth`, not args. Adjust: public `linkLineAccount` mutation takes only `{ lineUserId, accountId? }` and reads `userId` via `getAuthUserId`. Provide both:
- `linkLineAccount` (public mutation): args `{ lineUserId: v.string(), accountId: v.optional(v.string()) }`, resolves `userId` from auth, inserts/patches `lineUsers`.
- `getConvexUserByLineId` (internal query): args `{ lineUserId: v.string() }` → returns `userId | null`.

**Step 2: Implement `convex/line.ts`** with the two functions above using `.withIndex("by_lineUserId", q => q.eq("lineUserId", args.lineUserId)).unique()`.

**Step 3: Run** `npm run test:convex` → PASS.

**Step 4: Commit** `git commit -m "feat(line): linkLineAccount mutation + resolver query"`

---

### Task 3: HMAC signature verification (pure util)

**Files:**
- Create: `convex/lib/line/verify.ts`
- Test: `convex/lib/line/verify.test.ts`

**Step 1: Write the failing test**
```ts
import { describe, it, expect } from "vitest";
import { verifyLineSignature } from "./verify";
import crypto from "crypto";

describe("verifyLineSignature", () => {
  it("accepts a valid HMAC-SHA256 signature", () => {
    const secret = "testsecret";
    const body = '{"events":[]}';
    const sig = crypto.createHmac("sha256", secret).update(body).digest("base64");
    expect(verifyLineSignature(body, sig, secret)).toBe(true);
  });
  it("rejects a wrong signature", () => {
    expect(verifyLineSignature('{"events":[]}', "abc=", "testsecret")).toBe(false);
  });
});
```

**Step 2: Implement** `verifyLineSignature(body: string, signature: string, secret: string): boolean` using `crypto.createHmac("sha256", secret).update(body).digest("base64")` and `timingSafeEqual`.

**Step 3: Run** `npm run test:convex` → PASS.

**Step 4: Commit** `git commit -m "feat(line): HMAC signature verification util"`

---

### Task 4: LINE webhook HTTP action

**Files:**
- Modify: `convex/http.ts`
- Modify/Create: `convex/line.ts` (`lineWebhook` httpAction + `parseLineReceipt` internal action)
- Test: `convex/line.test.ts` (extend with webhook test using mocked fetch)

**Step 1: Write the failing test** (webhook with mocked global fetch)
```ts
test("lineWebhook verifies sig and ingests image for linked user", async () => {
  const t = convexTest(schema);
  await t.runMutation(internal.line.linkLineAccount, { lineUserId: "Uabc", userId: "user_1" });
  const body = JSON.stringify({
    events: [{ type: "message", message: { type: "image" }, source: { userId: "Uabc" }, replyToken: "rt" }],
  });
  const sig = crypto.createHmac("sha256", "secret").update(body).digest("base64");
  const fakeImage = Buffer.from("fake").toString("base64");
  global.fetch = async (url: any) => {
    if (String(url).includes("line") && String(url).includes("content")) {
      return new Response(Buffer.from(fakeImage, "base64"), { status: 200, headers: { "content-type": "image/jpeg" } });
    }
    return new Response("{}", { status: 200 });
  } as any;
  const req = new Request("https://convex/site/line/webhook", {
    method: "POST",
    headers: { "x-line-signature": sig },
    body,
  });
  const res = await t.executeHttp("lineWebhook", req); // helper from convex-test if available; else call handler directly
  expect(res.status).toBe(200);
  const receipts = await t.query(api.receipts.listForTest ?? (internal as any), {}); // assert a receipt with source "line" exists
});
```
Adapt to the convex-test HTTP execution API available in the repo (check `convex/vitest.config.ts` and existing http tests). If convex-test lacks `executeHttp`, test the handler function directly by importing it.

**Step 2: Implement**
- `lineWebhook` httpAction: read raw body text, verify sig via `verifyLineSignature`, parse JSON, for each `message` event with `type:"image"` fetch content (`https://api-data.line.me/v2/bot/message/{id}/content`, Bearer `LINE_CHANNEL_ACCESS_TOKEN`), base64-encode, resolve `userId` via `getConvexUserByLineId`, then `ctx.runAction(internal.line.parseLineReceipt, { userId, base64Image, accountId })`. Reply via LINE Reply API (optional, guard on token presence). Always return 200.
- `parseLineReceipt` internal action: args `{ userId: v.string(), base64Image: v.string(), accountId: v.optional(v.string()) }`; reuse `validateAmount/validateMerchant/normalizeCategory/validateDate` and `ctx.runMutation(internal.receipts.saveReceipt, { userId, …, source: "line", geminiModel: "gemini-2.5-flash" })`. (If `saveReceipt` lacks a `source` param, patch it to accept and store `source`.)

**Step 3: Run** `npm run test:convex` → PASS.

**Step 4: Commit** `git commit -m "feat(line): webhook httpAction + parseLineReceipt internal action"`

---

### Task 5: Wire `/line/webhook` route

**Files:**
- Modify: `convex/http.ts`

**Step 1:** Add route:
```ts
import { lineWebhook } from "./line";
http.route({ path: "/line/webhook", method: "POST", handler: lineWebhook });
```

**Step 2: Run** `npm run typecheck` → PASS.

**Step 3: Commit** `git commit -m "feat(line): mount /line/webhook route"`

---

### Task 6: Client LIFF link screen

**Files:**
- Create: `src/hooks/use-line-link.ts`
- Create: `src/app/settings/line-link/page.tsx`
- Test: `src/hooks/use-line-link.test.tsx` (RTL + mocked `api.line.linkLineAccount`)

**Step 1: Write the failing test** (mock the mutation, assert it is called with the LIFF userId)
```ts
import { renderHook, act } from "@testing-library/react";
import { useLineLink } from "./use-line-link";
// mock liff + api
```

**Step 2: Implement** `use-line-link.ts`: init LIFF (`window.liff.init({ liffId: NEXT_PUBLIC_LINE_LIFF_ID })`), `getProfile().userId`, call `useMutation(api.line.linkLineAccount, { lineUserId, accountId })`. Page renders a button "Link my LINE account" and shows success/error.

**Step 3: Run** `npm test` (vitest) → PASS. `npm run lint` → PASS.

**Step 4: Commit** `git commit -m "feat(line): LIFF account-link screen + hook"`

---

### Task 7: Docs, env vars, final gate

**Files:**
- Modify: `README.md` (add "LINE receipt bot" section + required Convex env vars: `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`, `NEXT_PUBLIC_LINE_LIFF_ID`), `CLAUDE.md` (note new table + route)
- Test: none new

**Step 1:** Add env-var names (NO secrets) and a short "How the LINE bot ingests receipts" paragraph.

**Step 2: Run full gate** `npm run ci` → all green.

**Step 3: Commit** `git commit -m "docs(line): document LINE bot integration + env vars"`

---

## Improvements discovered during build (append here)

- _(subagents append real findings, e.g. convex-test HTTP API shape, saveReceipt signature patch)_
