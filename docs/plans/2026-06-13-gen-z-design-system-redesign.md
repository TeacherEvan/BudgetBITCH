# Gen Z Design System Redesign — BudgetBITCH

**Date:** 2026-06-13
**Branch:** `feat/gen-z-design-system`
**Scope:** Design system + core components (buttons, cards, inputs, navigation, data viz)
**Status:** DESIGN PHASE — awaiting approval

---

## 1. Problem Statement

The current BudgetBITCH UI is a bare Next.js starter template:
- Geist fonts (corporate, sterile)
- Minimal Tailwind config (no design tokens)
- No motion system
- No visual personality
- No theme customization

Gen Z users (14-25) expect: **authenticity, personalization, motion, maximalist expression, anti-perfection craft.**

---

## 2. Design Direction: Adaptive Theme System

Users choose their visual vibe at onboarding (persisted in Convex). Four presets:

| Preset | Vibe | Key Colors | Typography | Motion Feel |
|--------|------|------------|------------|-------------|
| **Cyber Y2K** | Neon, chrome, glitch, retro-future | `#00FFFF`, `#FF00FF`, `#39FF14`, `#C0C0C0` | Chakra Petch + Press Start 2P | Glitch transitions, scanline shaders |
| **Dopamine Maximalist** | High-contrast, saturated, chaotic joy | `#8B5CF6`, `#EF4444`, `#A3E635`, `#06B6D4` | Space Grotesk + Inter Variable | Springy, bouncy, kinetic type |
| **Raw Brutalist** | Imperfect, hand-crafted, anti-AI | `#DC2626`, `#FACC15`, `#2563EB`, `#18181B` | Outfit + handwritten accent | Mechanical, tactile, no easing |
| **Midnight Minimal** (default) | Dark, calm, focused — but not sterile | `#0F172A`, `#1E293B`, `#334155`, `#64748B` | Inter Variable + Space Grotesk | Subtle, refined, respectful |

**Shared foundations:** Dark mode default, reduced-motion respect, WCAG AA contrast, variable fonts.

---

## 3. Design Tokens (DESIGN.md compatible)

### Color System
```css
/* Semantic tokens per theme — defined in tailwind.config.ts + CSS variables */
:root {
  /* Cyber Y2K */
  --cyber-bg: #0a0a0f;
  --cyber-surface: #11111a;
  --cyber-primary: #00FFFF;
  --cyber-secondary: #FF00FF;
  --cyber-accent: #39FF14;
  --cyber-chrome: #C0C0C0;
  --cyber-text: #F0F0F0;
  --cyber-text-muted: #888899;

  /* Dopamine Maximalist */
  --dopamine-bg: #0F0F0F;
  --dopamine-surface: #1A1A1A;
  --dopamine-primary: #8B5CF6;
  --dopamine-secondary: #EF4444;
  --dopamine-accent: #A3E635;
  --dopamine-highlight: #06B6D4;
  --dopamine-text: #FAFAFA;
  --dopamine-text-muted: #A0A0A0;

  /* Raw Brutalist */
  --raw-bg: #FAFAF9;
  --raw-surface: #F5F5F4;
  --raw-primary: #DC2626;
  --raw-secondary: #FACC15;
  --raw-accent: #2563EB;
  --raw-text: #18181B;
  --raw-text-muted: #525252;
  --raw-border: #18181B;

  /* Midnight Minimal (default) */
  --midnight-bg: #0F172A;
  --midnight-surface: #1E293B;
  --midnight-primary: #3B82F6;
  --midnight-secondary: #6366F1;
  --midnight-accent: #22D3EE;
  --midnight-text: #F1F5F9;
  --midnight-text-muted: #94A3B8;
  --midnight-border: #334155;
}
```

### Typography Scale
```css
/* Font families per theme */
--font-display-cyber: 'Chakra Petch', 'Space Grotesk', sans-serif;
--font-display-dopamine: 'Space Grotesk', 'Inter Variable', sans-serif;
--font-display-raw: 'Outfit', 'Caveat', cursive;
--font-display-midnight: 'Inter Variable', 'Space Grotesk', sans-serif;

--font-mono: 'Press Start 2P', 'VT323', monospace;
--font-body: 'Inter Variable', system-ui, sans-serif;

/* Fluid type scale (clamp) */
--text-xs: clamp(0.7rem, 0.65rem + 0.25vw, 0.75rem);
--text-sm: clamp(0.8rem, 0.75rem + 0.25vw, 0.875rem);
--text-base: clamp(0.95rem, 0.9rem + 0.25vw, 1rem);
--text-lg: clamp(1.1rem, 1rem + 0.5vw, 1.25rem);
--text-xl: clamp(1.3rem, 1.15rem + 0.75vw, 1.5rem);
--text-2xl: clamp(1.6rem, 1.4rem + 1vw, 2rem);
--text-3xl: clamp(2rem, 1.7rem + 1.5vw, 2.5rem);
--text-4xl: clamp(2.5rem, 2rem + 2.5vw, 3.5rem);
```

### Spacing & Radius
```css
--space-0: 0;
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-5: 1.25rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-10: 2.5rem;
--space-12: 3rem;
--space-16: 4rem;

--radius-sm: 0.25rem;
--radius-md: 0.5rem;
--radius-lg: 0.75rem;
--radius-xl: 1rem;
--radius-2xl: 1.5rem;
--radius-full: 9999px;

/* Theme-specific radius overrides */
--radius-cyber: 0;           /* sharp corners */
--radius-dopamine: 1.5rem;   /* pill/rounded */
--radius-raw: 0.125rem;      /* barely rounded */
--radius-midnight: 0.75rem;  /* balanced */
```

### Motion Tokens
```css
--ease-spring: cubic-bezier(0.68, -0.55, 0.27, 1.55);
--ease-snappy: cubic-bezier(0.4, 0, 0.2, 1);
--ease-glitch: steps(4, end);
--ease-mechanical: cubic-bezier(0.86, 0, 0.07, 1);

--duration-instant: 50ms;
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
--duration-page: 400ms;
```

### Shadows & Effects
```css
/* Cyber: neon glow */
--shadow-cyber-sm: 0 0 8px var(--cyber-primary), 0 0 16px var(--cyber-secondary);
--shadow-cyber-lg: 0 0 24px var(--cyber-primary), 0 0 48px var(--cyber-secondary);

/* Dopamine: colorful depth */
--shadow-dopamine-sm: 4px 4px 0 var(--dopamine-primary);
--shadow-dopamine-lg: 8px 8px 0 var(--dopamine-secondary), 16px 16px 0 var(--dopamine-accent);

/* Raw: harsh outline */
--shadow-raw: 2px 2px 0 var(--raw-border);

/* Midnight: subtle elevation */
--shadow-midnight-sm: 0 1px 3px rgba(0,0,0,0.3);
--shadow-midnight-lg: 0 10px 40px rgba(0,0,0,0.4);
```

---

## 4. Component Specifications

### 4.1 Button
**Variants:** `primary`, `secondary`, `ghost`, `danger`, `outline`
**Sizes:** `sm`, `md`, `lg`, `icon`
**States:** `default`, `hover`, `active`, `focus-visible`, `disabled`, `loading`

**Cyber:** Sharp corners, neon glow on hover, glitch text effect on active
**Dopamine:** Pill shape, spring scale (1.05), colorful offset shadow
**Raw:** Harsh outline, zero border-radius, offset shadow (2px 2px), no transitions
**Midnight:** Rounded, subtle elevation, smooth transitions

**Micro-interactions (all):**
- Press: `scale(0.97)` + haptic CSS vibration
- Focus: `focus-visible` ring (theme color, 3px offset)
- Loading: Spinner + disabled state

### 4.2 Card
**Variants:** `default`, `elevated`, `outlined`, `glass`, `interactive`
**Props:** `padding`, `radius` (theme-aware), `hoverable`

**Cyber:** Glassmorphism + neon border glow, scanline overlay
**Dopamine:** Colorful offset shadow, slight rotate on hover (-2deg to 2deg)
**Raw:** Paper texture, torn edge SVG mask, harsh outline
**Midnight:** Subtle elevation, clean border

### 4.3 Input / Textarea / Select
**States:** `default`, `focus`, `error`, `disabled`, `success`
**Label:** Floating label animation (frramer-motion)
**Helper text:** Error/success with icon animation

**Cyber:** Terminal-style, `_` cursor blink, scanline focus
**Dopamine:** Colorful focus ring, label bounces up
**Raw:** Underline only, handwritten label font, shake on error
**Midnight:** Clean floating label, smooth color transition

### 4.4 Navigation
**Components:** `TopBar`, `BottomNav` (mobile), `Sidebar`, `Tabs`, `Breadcrumb`
**Active state:** Theme-aware indicator (neon line / colorful pill / rough underline / subtle bar)

**Cyber:** Glitch transition between tabs
**Dopamine:** Springy sliding indicator
**Raw:** Instant snap, no animation
**Midnight:** Smooth slide, elevation change

### 4.5 Data Visualization (recharts + custom)
**Charts:** `LineChart`, `BarChart`, `PieChart`, `RadialProgress`, `Sparkline`
**Theme integration:** CSS variable colors, responsive container

**Cyber:** Neon stroke, grid lines as scanlines, tooltip = terminal
**Dopamine:** Gradient fills, animated entry (staggered), playful tooltips
**Raw:** Hand-drawn SVG paths (rough.js), sketchy axes
**Midnight:** Clean, accessible, high contrast

### 4.6 Theme Switcher
**Location:** Settings + onboarding
**UI:** Visual preview cards with live theme application
**Persistence:** Convex mutation → user.preferences.theme
**Transition:** Full-page crossfade (400ms) with theme-aware easing

---

## 5. Motion System (framer-motion)

### Page Transitions
```tsx
// layout.tsx wrapper
<AnimatePresence mode="wait">
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.4, ease: themeEase }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

### Layout Animations
- `layout` prop on shared elements (theme cards, nav items)
- `layoutId` for magic moves (theme switcher preview → applied)

### Scroll-Triggered
- `whileInView` for stagger entrance (dashboard cards, stats)
- `useScroll` + `useTransform` for parallax headers

### Gesture-Based
- `whileHover`, `whileTap`, `whileDrag` on interactive elements
- Drag-to-dismiss (notifications, modals)

### Reduced Motion
```tsx
const prefersReduced = useReducedMotion();
const transition = prefersReduced ? { duration: 0 } : themeTransition;
```

---

## 6. Implementation Architecture

### File Structure
```
budgetbitch/
├── src/
│   ├── design-system/
│   │   ├── tokens/
│   │   │   ├── colors.ts         # Theme color objects
│   │   │   ├── typography.ts     # Font stacks, scales
│   │   │   ├── spacing.ts        # Space, radius, shadows
│   │   │   ├── motion.ts         # Easing, durations
│   │   │   └── index.ts          # DesignTokens type
│   │   ├── themes/
│   │   │   ├── cyber.ts
│   │   │   ├── dopamine.ts
│   │   │   ├── raw.ts
│   │   │   ├── midnight.ts
│   │   │   └── registry.ts       # ThemeRegistry, getTheme()
│   │   ├── provider/
│   │   │   ├── ThemeProvider.tsx # Context + CSS var injection
│   │   │   ├── useTheme.ts       # Hook
│   │   │   └── ThemeScript.tsx   # Inline script for SSR sync
│   │   ├── components/
│   │   │   ├── Button/
│   │   │   ├── Card/
│   │   │   ├── Input/
│   │   │   ├── Nav/
│   │   │   ├── DataViz/
│   │   │   └── ThemeSwitcher/
│   │   ├── motion/
│   │   │   ├── pageTransition.tsx
│   │   │   ├── stagger.tsx
│   │   │   ├── kineticType.tsx
│   │   │   └── microInteractions.tsx
│   │   └── index.ts              # Barrel export
│   ├── app/
│   │   ├── globals.css           # Updated with design tokens
│   │   ├── layout.tsx            # ThemeProvider + fonts
│   │   └── page.tsx              # Demo page
│   └── convex/
│       └── schema.ts             # Add theme preference
```

### TailwindCSS v4 Integration
```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  theme: {
    extend: {
      colors: {
        // Semantic colors reference CSS variables
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        text: 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',
        border: 'var(--color-border)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        theme: 'var(--radius-theme)',
      },
      boxShadow: {
        theme: 'var(--shadow-theme)',
      },
      transitionDuration: {
        instant: '50ms',
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
        page: '400ms',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
        snappy: 'cubic-bezier(0.4, 0, 0.2, 1)',
        glitch: 'steps(4, end)',
        mechanical: 'cubic-bezier(0.86, 0, 0.07, 1)',
      },
    },
  },
} satisfies Config;
```

### Font Loading (next/font/google + local)
```tsx
// layout.tsx
import { Inter, Space_Grotesk, Chakra_Petch, Press_Start_2P, VT323, Outfit, Caveat } from 'next/font/google';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' });
const spaceGrotesk = Space_Grotesk({ variable: '--font-space-grotesk', subsets: ['latin'], display: 'swap' });
const chakraPetch = Chakra_Petch({ variable: '--font-chakra-petch', subsets: ['latin', 'thai'], display: 'swap' });
const pressStart2P = Press_Start_2P({ variable: '--font-press-start', subsets: ['latin'], display: 'swap' });
const vt323 = VT323({ variable: '--font-vt323', subsets: ['latin'], display: 'swap' });
const outfit = Outfit({ variable: '--font-outfit', subsets: ['latin'], display: 'swap' });
const caveat = Caveat({ variable: '--font-caveat', subsets: ['latin'], display: 'swap' });
```

---

## 7. Convex Schema Update

```ts
// convex/schema.ts
defineSchema({
  users: defineTable({
    // ...existing fields
    preferences: v.optional(v.object({
      theme: v.union(
        v.literal('cyber'),
        v.literal('dopamine'),
        v.literal('raw'),
        v.literal('midnight')
      ),
      reducedMotion: v.optional(v.boolean()),
      fontScale: v.optional(v.number()), // 0.875 - 1.25
    })),
  }).index('by_email', ['email']),
  // ...
});
```

---

## 8. Testing Strategy

### Unit Tests (vitest + testing-library)
- ThemeProvider: CSS var injection, theme switching, persistence
- Button: All variants, states, theme-aware classes, micro-interactions
- Card: Variants, interactive states
- Input: Floating label, validation states, theme styles
- ThemeSwitcher: Preview, selection, Convex sync

### Visual Regression (playwright)
- Each component in all 4 themes
- Light/dark mode (though default is dark)
- Reduced motion on/off

### Accessibility (axe-core)
- WCAG AA contrast in all themes
- Focus management
- Screen reader labels

---

## 9. Rollout Plan

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| **1. Foundation** | Design tokens, ThemeProvider, CSS variables, font loading | 4h |
| **2. Core Components** | Button, Card, Input, Nav (all 4 themes) | 8h |
| **3. Data Viz** | Chart components with theme integration | 4h |
| **4. Motion** | Page transitions, stagger, kinetic type, micro-interactions | 6h |
| **5. Theme Switcher** | UI, Convex sync, crossfade transition | 3h |
| **6. Demo Page** | Showcase all components + theme switcher | 2h |
| **7. Testing** | Unit + visual + a11y | 3h |

**Total: ~30h** across multiple sessions.

---

## 10. Personal Touches (Evan's Flavor)

1. **Thai language support** in Chakra Petch (already has Thai subset)
2. **Baht currency formatting** in data viz tooltips
3. **Bangkok timezone** as default for date displays
4. **"Teacher Evan" persona** easter egg in Raw theme (handwritten notes)
5. **Offline-first** PWA with cute "no wifi" illustration per theme
6. **Sound design** (optional): Subtle UI clicks per theme (Web Audio API)
7. **Konami code** unlocks "Matrix" sub-theme (green cyber)

---

## 11. Open Questions

1. **Sound?** Web Audio API for micro-interaction sounds (opt-in)?
2. **3D/Spline?** Claymation 3D mascots per theme (Raw theme especially)?
3. **Animation library?** framer-motion covers it, but consider `motion-one` for lighter weight?
4. **Component library?** Build custom vs extend `shadcn/ui`? (Custom for full theme control)

---

## 12. Approval Gate

**This design must be approved before any code is written.**

- [ ] Scope confirmed
- [ ] Theme presets approved
- [ ] Typography stack approved
- [ ] Motion scope approved
- [ ] Architecture approved
- [ ] Rollout plan accepted

---

*Next: Phase 2 — Writing Plans (detailed task breakdown with TDD steps)*