# Currency by Location — Design & Plan (2026-07-19)

## Rule (from user)
- Currency symbol is determined by **location**, not language/locale.
- If the location request is **not accepted / not resolved** (no cached country), **no currency symbol** is shown — only numeral symbols (grouped digits).

## Decision (best-judgment; clarify timed out)
"Not accepted" = `LocationCache.country` is missing/unsupported. Resolved via existing
`detectHomeBaseFromCurrentArea()` → `LocationCache.country` (`'TH' | 'US' | 'OTHER'`).

Mapping:
- `TH` → `THB` (฿)
- `US` → `USD` ($)
- `OTHER` | `null` | `undefined` → **no symbol** (e.g. `12,500`)

`locationConsent` (wizard Q10) is a separate privacy pref; currency follows whether a
country was actually resolved (which implies the request was accepted).

## Why this is safe
- `getLocationCache()` only runs in `useEffect` (client). Initial `useState(null)` matches SSR
  render → no hydration mismatch; effect updates symbol post-mount.
- Locale stays a pure language pref; currency is now decoupled from it.

## Implementation tasks (TDD)
1. `src/lib/utils/currency.ts`: add `CurrencyCode`, `currencyFromLocation()`, `formatMoney()`
   (null currency → grouped numerals, no symbol); keep `formatCurrency(amount, locale, currency?)`
   for non-React callers. + `currency.test.ts`.
2. `src/hooks/use-currency.ts`: `useResolvedCurrency()` (reads getLocationCache → currency) and
   `useCurrency()` returning a `(amount, locale?) => string` formatter with identical signature to the
   old `formatCurrency`. + `use-currency.test.tsx`.
3. Update dashboard components: swap `import { formatCurrency } from '@/lib/utils/currency'`
   for `const formatCurrency = useCurrency();` (mechanical, signature-compatible).
   Components: daily-disposable-hero, critical-expenses-modal, panels/{net-worth-asset-item,
   savings-goals, bills, subscriptions, budget-visual, cash-flow-forecast, voice-expense-input,
   debt-payoff, expense-tracker, budget-alerts, emergency-fund, net-worth-header,
   net-worth-liability-item}.
4. Update utils that call formatCurrency internally: `budget-alerts.ts`, `compound-calculator.ts`
   → accept optional `currency` param; pass it from their component callers.
5. Verify: `npm run test`, `npm run lint`, `npm run build`.

## Out of scope (YAGNI)
- Per-user currency override UI, multi-currency, server-side currency resolution.
