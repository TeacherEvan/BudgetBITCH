# Task 6 Report: Quick-Add Dirty Guard + Confirm-First Ordering

## Status: DONE (implemented inline after subagent rate-limit)

## Fixes
- `src/hooks/use-quick-add-state.ts`: dirtyFields ref + wrapper setters for
  scannedAmount/Merchant/Category/Date/Tax/LineItems/inputText; bot-draft
  effect returns early per-field when dirty; `[draft, botDrafts]` deps
  (botDraftId dropped, eslint-disabled with rationale); `isSaving` re-entry
  guard; confirm-then-local-add in both bot and session paths (session path
  was at risk of losing the local add after refactor — restored after
  confirmDraft); dirtyFields cleared on save; updateScannedLineItem marks dirty.
- `src/app/quick-add/page.test.tsx`: botDrafts/confirm mocks (api.* refs are
  objects, so route the single useMutation/useQuery to controllable mocks);
  new tests: edit-then-realtime-update preserves edits; double-click Save
  writes once.

## Verification
- `npm test -- src/app/quick-add/page.test.tsx src/hooks/use-quick-add-state.test.ts`: 28 passed
- `npm run typecheck`: clean; `npm run lint`: clean (0 warnings)
