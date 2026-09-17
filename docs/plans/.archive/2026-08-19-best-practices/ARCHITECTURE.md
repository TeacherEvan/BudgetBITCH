# ARCHITECTURE — 2026-08-19 Best-Practices Run

## Current → Target
This run is a **localized best-practices cleanup**, not a structural refactor.
No new runtime modules; no Convex `api.*` changes. Three independent edits +
one doc rewrite, each isolated to its own folder/area.

## Areas being edited
| Area | File(s) | Change | Risk |
|------|---------|--------|------|
| Auth decommission | `src/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `package.json` | Delete scaffold, uninstall `next-auth` | LOW — 4 imports all inside the deleted files |
| UI polish | `src/components/ui/progress-ring.tsx` | Remove duplicate `strokeDasharray` attribute | LOW — cosmetic, style form kept |
| i18n | `src/app/quick-add/page.tsx` + `src/i18n/locales/{en,es,fr,de,pt,zh}.ts` | `useTranslations('QuickAdd')` migration | MEDIUM — typed catalogs, must keep parity |
| Docs | `SECURITY.md` | Replace boilerplate with real policy | NONE — doc only |

## Interfaces / dependencies
- `quick-add/page.tsx` consumes `useTranslations` from `next-intl` (already a
  project dependency, used elsewhere). No new import beyond `next-intl`.
- Locale catalogs are typed `LocaleMessages` (from `src/i18n/locales/en`). The
  `QuickAdd` namespace object must conform to the same shape used by other
  namespaces (e.g. `Login`, `Dashboard`). Verify against an existing namespace's
  key structure.
- Deleting `src/auth.ts` removes the only `next-auth` import sites; `package.json`
  `next-auth` entry removed; `npm uninstall` not strictly required if removed
  from package.json + lockfile regenerated, but `npm uninstall next-auth` is the
  clean path (updates lockfile).

## Data / control flow
- No data-flow change. Quick Add still writes to IndexedDB + Convex; only the
  source of its UI string literals changes (inline → next-intl catalog).
- `progress-ring` is a pure presentational SVG; removing the attribute has no
  behavioural effect (style form already authoritative).

## Security boundaries
- No auth boundary crossed. `@convex-dev/auth` untouched. No secret exposure.
- `SECURITY.md` rewrite documents the real boundary (Convex Auth, localStorage
  token, VAPID web-push, LINE HMAC verification) — advisory doc only.

## AC mapping
- AC-001 ← Auth decommission area
- AC-002 ← UI polish area
- AC-003 ← i18n area
- AC-004 ← Docs area
- AC-005 ← all areas (gate re-run)
