# GL&E Platform → Budget Boss Merger Plan

Status: DRAFT (investigation + plan). No code merged yet.
Last reviewed: 2026-08-18.

## 0. TL;DR Decision

**Absorb GL&E's durable document-intelligence ideas into Budget Boss; do not
stand up the Java/Spring engine as a live service.**

GL&E (`/home/ewaldt/Documents/VS/GAMES/gle-platform`) is a Java 21 / Maven /
Spring Boot / PostgreSQL "toy" platform whose flagship is *Receipt Intelligence*.
Budget Boss (`/home/ewaldt/Documents/VS/GAMES/BudgetBITCH`) is the real,
shipping product: Next.js 16 + Convex, auth, PWA, multi-board sharing, 656 unit
tests, 195 Convex tests, 25 E2E specs. It already does receipt OCR (tesseract.js
client-side + Gemini 2.5 Flash server-side), SMS import, and CSV import.

The two stacks do not compile together (JVM vs Node serverless). A literal repo
merge is meaningless. The valuable merger is **concept + algorithm porting**:
GL&E encodes three things Budget Boss has only partially — weighted confidence
combining, confidence-gated review status, and cross-receipt duplicate
detection — plus a deterministic eval harness. Those are the assets to keep.

## 1. Situation Analysis

### What GL&E has (read from source)
- `gle-intelligence-engine` — OCR port (`OcrProvider`, `OcrProviderFactory`,
  `MockOcrProvider`, `TesseractCliOcrProvider`), `ReceiptParser`,
  `ReceiptIntelligenceEngine`.
- `gle-receipt-pipeline` — `ConfidenceEngine.combine(ocr, extraction,
  validation)` weighted 0.45 / 0.35 / 0.20, rounded to 3 dp.
- `gle-integration` — `ReviewPolicy.status(confidence, duplicate)` maps to a
  receipt status; `DuplicateDetector` / `InMemoryDuplicateDetector` keyed on a
  canonical `fingerprint`; `ReceiptIntegrationService` + `BudgetProjectionService`
  project a *confirmed* receipt to a `BudgetTransaction`.
- `gle-api` — Spring Boot REST (`POST /v1/receipts/scan`, API-key auth,
  idempotency key), needs Postgres + Redis + MinIO (docker-compose).
- `packages/gle-eval` — Python 3.11 harness grading extraction vs
  `golden_receipts.jsonl`.

### What Budget Boss already has (read from source)
- `convex/receipts.ts` — `proxyReceiptScan` (HF TeacherBOY bot → Gemini vision)
  and `parseReceipt` (Gemini 2.5 Flash) → `saveReceipt` mutation.
- `convex/lib/receipt/types.ts` — `OcrPayload`, per-field `confidence:
  Record<FieldName, number>`, `ScrapeResult` with `fields/confidence/evidence/
  questions/items`. Confidence exists per field but there is **no documented
  weighted overall-combine** and **no confidence-gated auto-status**.
- `convex/lib/receipt/fingerprint.ts` + `templates/{za,th}.ts` — merchant-name
  regex fingerprint used only for **template tiering**, NOT cross-receipt
  duplicate detection.
- `convex/schema.ts` — `receipts` table has `fingerprint: v.any()` (currently
  unused for dedup), `status` ("draft"/"confirmed" only).

### Overlap to avoid double-building
Both do OCR, both parse receipts, both carry confidence. **Do not** port GL&E's
Java OCR or Spring API. Keep Budget Boss's tesseract.js + Gemini live path.

## 2. Assets Worth Porting (the real value)

| GL&E asset | Budget Boss gap | Port shape |
|---|---|---|
| `ConfidenceEngine.combine` | per-field conf, no weighted overall | `convex/lib/receipt/confidence.ts` → `combineConfidence(ocr, extraction, validation)` |
| `ReviewPolicy.status` | status only draft/confirmed, no auto-gate | `convex/lib/receipt/reviewPolicy.ts` → `reviewStatus(overallConf, isDuplicate)` returning `auto_confirm \| needs_review \| needs_override` |
| `DuplicateDetector` + canonical fingerprint | fingerprint field unused for dedup | `convex/lib/receipt/dedup.ts` + `by_fingerprint` index on `receipts` |
| `CanonicalReceipt` DTO + provenance | no stable intermediate model | adopt as the shared `ScrapeResult` shape (already close) |
| `gle-eval` golden-dataset harness | relies on live LLM, no regression gate | port `golden_receipts.jsonl` + a TS eval script under `scripts/eval-receipts/` |

Everything else in GL&E (Spring API, Postgres boundary, MinIO, Java SDKs,
`packages/*`) is **out of scope** and should be archived, not merged.

## 3. Target Architecture (post-merge)

Budget Boss keeps its stack. GL&E becomes a thin set of TS modules under
`convex/lib/receipt/` plus an eval harness. No new runtime, no new cloud service.

```
convex/lib/receipt/
  confidence.ts      # ported combine()
  reviewPolicy.ts    # ported status()
  dedup.ts           # ported detector + fingerprint canonicalization
  fingerprint.ts     # EXISTS — extend to emit canonical dedup key
  engine.ts          # EXISTS — call confidence+reviewPolicy after scrape
  types.ts           # EXISTS — add overallConfidence, reviewStatus fields
convex/receipts.ts   # wire: after parse/scrape, compute overall conf → reviewStatus → dedup check
convex/schema.ts     # receipts: add overallConfidence, reviewStatus; index by_fingerprint
scripts/eval-receipts/  # ported golden-dataset regression gate
```

## 4. Execution Plan (phased)

### Phase 0 — Nothing destructive
- Keep both repos intact. GL&E archived under `BudgetBITCH/vendor/gle-reference/`
  (or just left in place) as the source of truth for the algorithms.

### Phase 1 — Port confidence + review policy (low risk, pure functions)
1. Write `convex/lib/receipt/confidence.ts` mirroring
   `ConfidenceEngine.combine` (0.45/0.35/0.20, 0..1 guard, round 3dp).
2. Write `convex/lib/receipt/reviewPolicy.ts` mirroring
   `ReviewPolicy.status` (define thresholds; default needs_review below ~0.7,
   auto_confirm above, force needs_override when duplicate).
3. Unit tests beside each (`*.test.ts`) using GL&E's own test expectations as
   fixtures.
4. Gate: `npm run typecheck`, `npm test`.

### Phase 2 — Port duplicate detection (medium risk, schema change)
1. Extend `fingerprint.ts` to produce a canonical dedup key
   (merchant + normalized total + date + user) — distinct from the existing
   template-tier regex fingerprint.
2. Add `convex/lib/receipt/dedup.ts` with `detectDuplicate(ctx, key)` using a
   `by_fingerprint` index on `receipts`.
3. `convex/schema.ts`: add `overallConfidence: v.number()`,
   `reviewStatus: v.string()`, index `by_fingerprint`.
4. Wire into `parseReceipt` / `proxyReceiptScan` / `ingestReceipt`: after
   scrape, compute overall conf → reviewStatus → if duplicate, flag
   `needs_override` and surface in the review card (already editable).
5. Guard: `npm run check:idb` (no new IDB store, Convex only — but still verify
   build), `npm run test:convex`, `npm run build`.

### Phase 3 — Eval harness (quality gate)
1. Copy `gle-platform/packages/gle-eval/examples/golden_receipts.jsonl` →
   `scripts/eval-receipts/golden.jsonl`.
2. Write `scripts/eval-receipts/run.ts` that runs the TS engine over the golden
   set and asserts field-level accuracy vs GL&E's tolerance bands.
3. Wire as an optional `npm run eval:receipts` (not in `npm run ci` until stable).

### Rollout
- Ship Phase 1 + 2 behind the existing editable review card — nothing
  auto-commits (Budget Boss already enforces "nothing auto-commits"). Status is
  advisory until user confirms.
- Phase 3 is a local/dev gate only; GL&E's Java engine is retired as reference.

## 5. Risks / Blocks
- **Stack mismatch** is the only hard constraint; resolved by porting algorithms,
  not services. No Spring/Postgres introduced into Budget Boss.
- **Thresholds** in `ReviewPolicy` are product decisions (the 0.7 band is a
  placeholder — confirm with user before enabling auto_confirm in any flow).
- **Duplicate key design** must not false-positive across users/boards; scope the
  fingerprint to `userId` + canonical key.
- GL&E's `MockOcrProvider` is useful only for tests; port the *idea* as a test
  fixture, not the Java class.

## 6. Verification
- `npm run lint && npm run typecheck && npm test && npm run test:convex &&
  npm run build` green after Phases 1–2.
- New unit tests in `convex/lib/receipt/*.test.ts` cover combine/reviewPolicy/dedup.
- `npm run eval:receipts` passes against the ported golden set (Phase 3).

## 7. Out of Scope (explicitly NOT merging)
- Spring Boot `gle-api`, PostgreSQL/Flyway, Redis, MinIO.
- `gle-core-sdk`, `gle-intelligence-engine`, `gle-receipt-pipeline` Java source.
- `packages/*` SDKs (Java/Kotlin/Python/TS), `apps/demo-web` (SvelteKit).
- Docker Compose stack.
- The 17 Java platform packages — reference only.

---
Open question for the user before Phase 2 lands: should `reviewStatus`
`auto_confirm` ever *skip* the user review card, or stay advisory-only? Budget
Boss's current invariant is "nothing auto-commits" — recommend keeping it
advisory and only auto-flagging.
