# Mobile Dashboard Panels — Design

**Date:** 2026-07-19
**Scope:** Mobile (`lg:hidden`) dashboard layout only. Desktop (`lg:` and up) is untouched.

## Problem

Current mobile dashboard renders a vertical `BentoGrid` stack of every toggled-on panel below the
Daily Disposable Hero, plus a floating bottom-left FAB that opens a bottom-sheet menu to toggle
panels. To see any panel the user must:

1. open the sheet,
2. toggle a panel on,
3. close the sheet,
4. scroll down a growing single-column stack.

This produces a long vertical scroll and a hidden, modal-only way to switch content. The mobile
view needs to minimise scroll and make panel switching a direct, always-visible action.

## Goal

Replace the mobile scroll-stack with a **bottom tab bar** that swaps a single active panel in place.
Hero stays pinned at the top; only one panel is in the DOM at a time on mobile. Zero scroll-through
of stacked panels. Full panel access preserved via a "More" tab that reuses the existing bottom sheet.

## Design

### State (in `DashboardShell`)

- Keep `openPanels: PanelKey[]` for the desktop `BentoGrid` (unchanged).
- Add `mobileActivePanel: PanelKey` (default `'expenses'`) — which single panel renders on mobile.
- `setMobileActivePanel(panel)` swaps the active mobile panel.
- Bottom-sheet panel buttons call `setMobileActivePanel` + close the sheet (instead of toggling openPanels).

### Mobile Layout (`lg:hidden`)

```
┌─────────────────────────────┐
│ HeaderBar (sticky)          │
├─────────────────────────────┤
│ scrollable region           │
│  ┌───────────────────────┐  │
│  │ Daily Disposable Hero │  │  (pinned at top)
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ ONE active panel       │  │  (mobileActivePanel)
│  └───────────────────────┘  │
├─────────────────────────────┤
│ Bottom Tab Bar (fixed)      │
│ 💸  📊  🎯  💰  🔔  ⋯     │
└─────────────────────────────┘
```

- Scrollable region holds Hero + the single active panel. Content that exceeds viewport scrolls
  inside that region; the tab bar stays fixed.
- Bottom tab bar: 5 primary tabs (Expenses, Budget, Goals, Net Worth, Alerts) + "More" (⋯).
  - Primary tabs set `mobileActivePanel` on tap.
  - Active tab gets an `aria-current="page"` and a highlighted style.
  - "More" opens the existing bottom-sheet menu (all 10 panels + Cut One Expense + Market Watch).
    Tapping a panel there sets `mobileActivePanel` and closes the sheet.

### Desktop Layout (`lg:` and up) — UNCHANGED

- `lg:block` sidebar with toggle buttons → `openPanels` → `BentoGrid` of all toggled panels.
- Right `xl:block` alerts sidebar.
- No tab bar; no `mobileActivePanel` logic applied.

### Removed

- The floating bottom-left FAB (`Mobile Menu FAB`) — replaced by the "More" tab.

## Components

| File | Change |
|------|--------|
| `src/components/dashboard/dashboard-shell.tsx` | Add `mobileActivePanel` state; render single active panel on mobile; new `<MobilePanelTabs>`; rewire bottom-sheet panel buttons to `setMobileActivePanel`; remove FAB. |
| `src/components/dashboard/mobile-panel-tabs.tsx` | NEW: fixed bottom tab bar (primary tabs + More). Receives `activePanel`, `onSelect`, `onMore`. |
| `src/components/dashboard/mobile-panel-tabs.test.tsx` | NEW: tests for render, active state, selection, More callback. |
| `src/components/dashboard/dashboard-shell.test.tsx` | NEW: mobile mode — only one panel in DOM; tab swap changes rendered panel; More opens sheet. |

## Primary Tabs (mobile)

`expenses`, `budget`, `goals`, `netWorth`, `budgetAlerts` (Alerts). Remaining panels
(`budgetAlerts` already primary; others: `bills`, `subscriptions`, `emergency`, `debt`, `forecast`)
live under "More".

## Accessibility

- Bottom tab bar is a `nav` with `aria-label`.
- Each tab is a `button` with `aria-current="page"` when active.
- "More" is a button that opens the bottom sheet (already `role="dialog"`-style overlay via transform).

## Out of Scope (YAGNI)

- No new panel content; reuses existing panel components.
- No changes to desktop, alerts sidebar, modals, or wizard.
- No swipe gestures / carousel.
