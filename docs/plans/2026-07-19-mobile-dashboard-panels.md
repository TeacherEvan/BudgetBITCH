# Mobile Dashboard Panels — Implementation Plan

**Date:** 2026-07-19
**Pattern:** TDD — write failing test first, watch fail, implement, watch pass, commit per task.
**Scope:** Mobile (`lg:hidden`) dashboard only. Desktop untouched.

Conventions (from repo):
- Tests: vitest + @testing-library/react, jsdom, `src/test/setup.ts`, `root vitest.config.ts`.
- Mock `next-intl` (`useLocale`), `@/hooks/use-local-db` (`useWizardProfile`), `@/hooks/use-critical-expense` (`useCriticalExpense`), `@/hooks/use-voice` (`useVoice`) as needed.
- Wrap renders in `<ThemeProvider>`.

---

## Task 1 — `MobilePanelTabs` component + tests

**Test (`mobile-panel-tabs.test.tsx`), must FAIL first:**
- Renders 5 primary tabs with icon + label for locale `en`.
- Active tab has `aria-current="page"`.
- Clicking a non-active tab calls `onSelect` with the correct panel key.
- Clicking "More" calls `onMore`.

**Implement `mobile-panel-tabs.tsx`:**
- Props: `activePanel: PanelKey`, `onSelect: (p: PanelKey) => void`, `onMore: () => void`, `locale: 'th' | 'en'`.
- Fixed bottom `nav` (`lg:hidden`), 5 primary tabs + More.
- Primary tabs: `expenses`, `budget`, `goals`, `netWorth`, `budgetAlerts`.
- Use `PANEL_CONFIG` icon/label from `dashboard-shell` — export `PANEL_CONFIG` for reuse (or pass a config map).

**Verify:** `npm run test` passes for this file.
**Commit:** `feat(dashboard): add MobilePanelTabs bottom tab bar (TDD)`

---

## Task 2 — Wire `mobileActivePanel` into `DashboardShell` + tests

**Test (`dashboard-shell.test.tsx`), must FAIL first:**
- Render `DashboardShell` in mobile context (no `lg` classes applied — jsdom has no viewport, so assert structure, not CSS).
- Assert only ONE panel body is rendered at a time (e.g. `getByTestId('panel-card')` count === 1, or the active panel's title heading present and others absent).
- Clicking a tab in the bottom bar swaps which single panel is rendered.
- "More" button opens the bottom sheet (`mobileMenuOpen` true).

**Implement in `dashboard-shell.tsx`:**
- Add `const [mobileActivePanel, setMobileActivePanel] = useState<PanelKey>('expenses');`
- Add `<MobilePanelTabs activePanel={mobileActivePanel} onSelect={setMobileActivePanel} onMore={() => setMobileMenuOpen(true)} locale={locale} />` (inside `lg:hidden` region / after content).
- Mobile content: render Hero + the single `PANELS.find(p => p.id === mobileActivePanel)` via `BentoGrid` with a one-item array (or directly). Desktop keeps `visiblePanels` + `BentoGrid`.
- Bottom-sheet panel buttons: change `onClick` from `togglePanel` to `() => { setMobileActivePanel(panel); setMobileMenuOpen(false); }`.
- Remove the floating FAB block.
- Export `PANEL_CONFIG` (or a shared config) for `MobilePanelTabs`.

**Verify:** `npm run test` passes.
**Commit:** `feat(dashboard): mobile bottom tabs swap single active panel, remove FAB`

---

## Task 3 — Verify desktop untouched + lint/build

- `npm run lint` clean.
- `npm run build` succeeds (placeholder `NEXT_PUBLIC_CONVEX_URL` as CI does).
- Confirm desktop path still uses `openPanels`/`BentoGrid` (existing `bento-grid` and shell tests still pass).

**Commit (if any fix):** `fix(dashboard): lint/build hygiene after mobile tab bar`

---

## Execution Mode

Subagent-driven (per superpowers): dispatch implementer per task → spec reviewer → code-quality
reviewer. Given model/timeout constraints, tasks are small and self-contained; implement directly in
parent session if subagents fail. Manual option available.
