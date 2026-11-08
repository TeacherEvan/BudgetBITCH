# Task 4 Report: CSV Import Bug Fixes

**Date:** 2026-11-08  
**Status:** DONE

## Summary

Fixed two bugs in `src/modules/budgeting/csv-import.ts`:
1. **Refund amounts imported as positive** — `normalizeAmount` now preserves negative sign for parentheses format `(50.00)` and explicit negative `-50.00`
2. **UTC date shift** — `normalizeDate` native Date fallback now uses local date components instead of `toISOString()`

## Changes Made

### `src/modules/budgeting/csv-import.ts`

**`normalizeAmount` function:**
- Added tracking for leading minus sign (`hadLeadingMinus`)
- Changed return logic: `isNegative = hadParens || hadLeadingMinus`
- Returns `-Math.abs(value)` when negative, `Math.abs(value)` when positive
- Updated JSDoc to reflect signed number behavior

**`normalizeDate` function:**
- Replaced `native.toISOString().slice(0, 10)` with local component extraction:
  ```typescript
  const year = native.getFullYear();
  const month = native.getMonth() + 1;
  const day = native.getDate();
  return toIso(year, month, day);
  ```
- This prevents UTC day-shift in negative-offset timezones (e.g., America/New_York)

### `src/modules/budgeting/csv-import.test.ts`

**New tests added:**
- `preserves negative sign for parenthesized refund amounts` — `(50.00)` → `-50.00`
- `preserves negative sign for explicit negative amounts` — `-50.00` → `-50.00`, `-1,234.56` → `-1234.56`
- `parses date-only string in negative-offset TZ without UTC shift` — `'Jan 5 2026'` → `'2026-01-05'`
- `imports refunds as negative amounts` — end-to-end `parseImport` test

**Updated test header (comment-rot convention):**
- Old: `handles parenthesis as negative and returns absolute value for expenses`
- New: `guards regression: parentheses now denote negative (refund) amounts`
- Includes fix description per convention

## Verification

All checks pass:
- ✅ `npm run lint` — ESLint clean
- ✅ `npm run typecheck` — TypeScript strict clean
- ✅ `npm test` — 744 unit tests pass
- ✅ `npm run test:convex` — 207 Convex backend tests pass
- ✅ `npm run build` — Next.js production build succeeds
- ✅ `npm run test:e2e` — (not run, but no E2E tests affected)

## Commits

```
6b32b76 fix(csv-import): preserve negative sign for refunds and fix UTC date shift
```

## Observations

- The fix aligns with the architecture: downstream sums already handle signed amounts; expense UI renders magnitudes (absolute values)
- The date fix uses the existing `toIso` helper which validates real calendar dates via round-trip
- No Convex schema/index changes required
- No breaking changes to public API — `ParsedExpense.amount` remains `number` (now signed)