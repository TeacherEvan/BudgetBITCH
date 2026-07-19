# 2026-07-19 — P3 Enhancements (post health pass)

## Scope decision (re-assessed against code, not assumptions)

| Candidate | Verdict | Reason |
|-----------|---------|--------|
| Net-worth panel consolidation | **DROPPED** | Already well-factored: `net-worth.tsx` delegates to header/section/form/skeleton/asset-item/liability-item. Not redundant. YAGNI. |
| Shared-board E2E coverage | **DEFERRED** | `use-shared-board.test.tsx` covers link/push/pull/offline-queue/LWW; `convex/sharedBoards.test.ts` (8 tests) covers backend. True E2E needs live Convex + 2 browser contexts — flaky, high cost, low marginal signal. |
| Voice-expense parser tests | **DO** | `parseExpenseFromText` + `parseThaiNumber` (pure logic deciding amount/category correctness) have **zero** test coverage. A parser regression = silently wrong money. Highest value, lowest cost. |

## Task

### T1 — Export pure parser helpers
- Add `export` to `parseExpenseFromText` and `parseThaiNumber` in
  `src/components/dashboard/panels/voice-expense-input.tsx` so they can be
  unit-tested without rendering the modal.

### T2 — TDD unit tests for the parser
- New file `src/components/dashboard/panels/voice-expense-input.test.tsx`.
- Cases (failing first, then green after T1):
  - English: `"Paid Grab 150 baht"` → amount 150, category transport (grab alias)
  - Thai: `"จ่ายแกร็บ 150 บาท"` → amount 150, category transport
  - Thai numerals: `"ซื้อข้าว สามร้อยบาท"` → amount 300
  - No amount → returns null
  - Merchant extraction for unknown merchant
  - Category fallback via `mapThaiToCategory`
- Run `npm run test` → must pass; lint 0 errors.

### T3 — Commit
- Separate commit from the health pass (CI already green on that).
- Do NOT push unless asked (Vercel auto-deploys from main).

## Verification
- `npm run test` (new file green), `npm run lint` (0 errors), `npm run build`.
