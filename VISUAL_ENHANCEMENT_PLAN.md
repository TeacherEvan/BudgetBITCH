# BudgetBITCH Visual Enhancement Plan

**Based on:** Current design system (OKLCH tokens, custom CSS utilities, Fraunces/Inter typography, dark teal/green theme)  
**Goal:** Modern, delightful, accessible UX following 2024-25 best practices

---

## 1. Motion & Micro-Interactions (Framer Motion already installed)

### 1.1 Page Transitions & Layout Animations
```tsx
// Add to globals.css or new motion.css
@layer components {
  .bb-enter { animation: bb-fade-slide-up 300ms ease-out; }
  .bb-exit { animation: bb-fade-slide-down 200ms ease-in; }
  @keyframes bb-fade-slide-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  @keyframes bb-fade-slide-down { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateY(-8px); } }
}
```

**Implementation:**
- Wrap wizard steps in `<AnimatePresence mode="wait">` with `motion.div` for smooth step transitions
- Stagger card entrances on dashboard (`delay: index * 50ms`)
- Add `whileHover` / `whileTap` to all interactive elements (buttons, cards, pills)
- Page-level transitions between auth → wizard → dashboard

### 1.2 Number Counters & Count-Up Animations
- Daily Disposable hero: animate number on mount/change (Framer `useSpring` or `animate` prop)
- Wizard progress ring: animate stroke-dashoffset on step change
- Savings rate slider: live counter as user drags

### 1.3 Celebration Moments
- **Wizard completion**: Confetti burst (canvas-confetti or Framer particles) + checkmark animation
- **Savings milestone**: Subtle "🎉" toast when hitting 10%/20%/50% savings rate
- **Streak tracking**: Fire emoji animation for consecutive days opening app

---

## 2. Data Visualization (Recharts installed, underutilized)

### 2.1 Dashboard Charts
```tsx
// New component: src/components/dashboard/budget-breakdown-chart.tsx
// Donut chart: Fixed vs Disposable vs Savings
// Area chart: 30-day disposable trend (from Convex snapshots)
// Bar chart: Category breakdown (rent, transport, etc.)
```

**Visual spec:**
- Use design tokens: `--accent` (#9dcab7), `--accent-strong` (#ccb37a), `--surface-accent`
- Tooltip styled with `.bb-panel-strong`
- Responsive: single column mobile, side-by-side desktop
- Reduced-motion: static fallback via `prefers-reduced-motion`

### 2.2 Wizard Progress Visualization
- Replace simple progress bar with **interactive timeline**:
  - Completed steps: filled with checkmark
  - Current step: pulsing ring
  - Future steps: muted
  - Click to jump (if not locked)
- Mini preview of each step's purpose on hover

---

## 3. Glass Morphism & Surface Depth (Elevate existing system)

### 3.1 Enhanced Panel Variants
```css
/* Add to globals.css @layer components */
.bb-panel-glass {
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border-soft);
  backdrop-filter: blur(24px) saturate(180%);
  box-shadow: 
    0 2px 8px rgba(0,0,0,0.15),
    0 0 0 1px rgba(255,255,255,0.03) inset;
}
.bb-panel-glass:hover {
  background: rgba(255,255,255,0.07);
  border-color: color-mix(in srgb, var(--accent-strong) 40%, transparent);
}
```

### 3.2 Layered Backgrounds
- Subtle **noise texture overlay** (SVG data URI, 0.5% opacity) on `body`
- **Radial glow accents** behind key CTAs (wizard Next button, hero)
- **Edge lighting** on focused/hovered cards (subtle `box-shadow` with accent color)

---

## 4. Smart Empty & Loading States

### 4.1 Skeleton Loaders (match panel dimensions exactly)
```tsx
// src/components/ui/skeleton.tsx
// Variants: text-line, card, metric, chart
// Uses --surface-1/2/3 for shimmer gradient
```

### 4.2 Empty State Illustrations
- **Wizard not started**: Friendly illustration + "Start your budget in 2 min"
- **No alerts**: Shield icon + "All clear — no budget warnings"
- **No launcher tools**: Rocket icon + "Add your first tool"
- Use consistent style: line art, accent color, 120px max height

---

## 5. Onboarding & Wizard Polish

### 5.1 Step Illustrations
| Step | Illustration Concept |
|------|---------------------|
| Income | Money bag / salary slip |
| Rent | House/key icon |
| Transport | BTS train / motorbike |
| Phone/Internet | Smartphone + wifi waves |
| Subscriptions | Stack of cards |
| Entertainment | Game controller / coffee cup |
| Healthcare | Cross / pill bottle |
| Savings Rate | Piggy bank / upward chart |
| Risk Tolerance | Shield / dice |
| Location | Map pin / GPS waves |

**Implementation:** SVG illustrations (200x200px) in `public/illustrations/`, imported as components. Fade in with Framer Motion.

### 5.2 Smart Defaults & Presets
- **Income**: Quick-select buttons (฿15k, 25k, 35k, 50k, 70k, Custom)
- **Rent**: "Bangkok Studio (฿8-12k)", "1BR (฿12-18k)", "Condo 1BR (฿18-30k)", "Custom"
- **Transport**: "BTS Daily (฿1.5k)", "Motorbike Fuel (฿800)", "Car (฿3k+)", "Walk/Bike (฿0)"
- Visual: Pill buttons with icons, single tap to fill + advance

### 5.3 Voice Visual Feedback
- When speaking: pulsing microphone icon in header
- Waveform animation in VoiceToggle component
- "Listening..." indicator during STT

---

## 6. Dashboard Hero Enhancements

### 6.1 Daily Disposable Hero v2
```tsx
// Add: 
// - Sparkline trend (last 7 days)
// - "vs last month" micro-comparison
// - Tap to expand → full budget breakdown modal
// - Celebration when > ฿500/day (configurable)
```

### 6.2 Quick Actions Bar
- Floating action button (FAB) bottom-right on mobile: "Add Expense", "Adjust Budget", "View Report"
- Desktop: sticky sidebar with same actions

---

## 7. Accessibility & Inclusive Design

### 7.1 Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```
- All Framer Motion: `reducedMotion: "user"` prop

### 7.2 High Contrast Mode
```css
@media (prefers-contrast: high) {
  :root {
    --border-soft: #fff;
    --border-strong: #fff;
    --text-muted: #ccc;
  }
}
```

### 7.3 Focus Visibility Enhancements
- Thicker focus rings (4px) with accent color
- Focus-visible-only styles (already good, verify all interactive elements)

---

## 8. Thai-First Polish

### 8.1 Typography
- Test Fraunces with Thai glyphs (may need fallback: Sarabun, Noto Sans Thai)
- Line height adjustments for Thai (taller ascenders/descenders)
- `text-wrap: balance` + `pretty` already set ✓

### 8.2 Number Formatting
- Thai numerals option (settings toggle)
- Baht symbol placement: `฿1,234.56` vs `1,234.56 ฿`
- Compact notation: `1.2k` → `1.2พัน`

### 8.3 Cultural Touches
- Songkran theme (April): water splash accent color
- Loy Krathong (Nov): floating lantern animation
- Thai holiday calendar integration in alerts

---

## 9. PWA & Install Experience

### 9.1 Splash Screens
- Generate via `pwa-asset-generator` for all device sizes
- Branded: BudgetBITCH logo + "Loading your budget..."

### 9.2 Install Prompt
- Custom in-app banner (not native browser prompt)
- Trigger: after wizard completion + 2nd visit
- Design: `.bb-panel-accent` with "Install App" primary button

---

## 10. Component Library Additions

| Component | Purpose | Priority |
|-----------|---------|----------|
| `Skeleton` | Loading states | High |
| `Toast` / `Sonner` | Notifications (milestones, errors) | High |
| `Tooltip` | Info icons, truncated text | Medium |
| `Command` / `CmdK` | Power user shortcuts (⌘K) | Medium |
| `Calendar` | Date picking for custom date ranges | Low |
| `ChartWrapper` | Recharts + skeleton + error boundary | High |

---

## Implementation Order (Phased)

### Phase 1: Foundation (Week 1)
- [ ] Add motion.css with enter/exit animations
- [ ] Skeleton loader component
- [ ] Reduced motion / high contrast media queries
- [ ] Toast system (Sonner or custom)

### Phase 2: Wizard Delight (Week 2)
- [ ] Step illustrations (SVG)
- [ ] Smart default presets per step
- [ ] Framer Motion step transitions
- [ ] Progress timeline component
- [ ] Completion celebration

### Phase 3: Dashboard Data Viz (Week 3)
- [ ] Budget breakdown donut chart
- [ ] 30-day trend area chart
- [ ] Category bar chart
- [ ] Hero sparkline + comparison

### Phase 4: Polish & PWA (Week 4)
- [ ] Glass panel variants
- [ ] Empty state illustrations
- [ ] Install prompt banner
- [ ] Thai numeral toggle
- [ ] Cultural theme accents

---

## Design Token Reference (Current)

```css
/* Colors */
--accent: #9dcab7;           /* Primary green */
--accent-strong: #ccb37a;    /* Gold/amber */
--accent-ink: #13211b;       /* Dark for on-accent */
--page-bg-top: oklch(0.79 0.05 148);
--page-bg-middle: oklch(0.3 0.035 195);
--page-bg-bottom: oklch(0.22 0.02 215);
--surface-1: color-mix(in srgb, #101817 86%, #d6ddd8 14%);
--surface-accent: color-mix(in srgb, #162127 74%, #c9b88b 26%);
--border-soft: color-mix(in srgb, #c7d7ce 16%, transparent 84%);
--border-strong: color-mix(in srgb, #d4c39a 36%, transparent 64%);

/* Typography */
--font-body: "Inter", system-ui, sans-serif;
--font-display: "Fraunces", Georgia, serif;

/* Spacing / Radius */
--radius-panel: 1.5rem;
--radius-card: 1.2rem;
--radius-badge: 0.9rem;
--radius-pill: 999px;
--pill-min-height: 1.9rem;

/* Shadows */
--shadow-soft: 0 24px 80px rgba(1, 10, 8, 0.28);
--shadow-card: 0 18px 48px rgba(0, 0, 0, 0.24);
```

---

## Success Metrics

- **Wizard completion rate**: Target >85% (currently unknown)
- **Time to complete wizard**: Target <3 min
- **Dashboard return rate (D7)**: Target >40%
- **PWA install rate**: Target >15% of eligible users
- **Accessibility score**: Lighthouse >95

---

## Notes for Implementation

1. **Preserve existing class names** - extend, don't replace `.bb-*` utilities
2. **Tree-shake Framer Motion** - import only `motion`, `AnimatePresence`, `useSpring`
3. **Recharts responsive** - use `ResponsiveContainer` with aspect ratio
4. **Convex real-time** - charts should subscribe to live data where possible
5. **i18n keys** - add all new strings to `src/i18n/messages.ts` (th/en)
6. **Testing** - Visual regression with Playwright (`test:e2e`)