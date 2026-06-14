# Expressive Minimalism Visual Upgrade Implementation Plan

> **For implementer:** Use TDD throughout. Write failing test first. Watch it fail. Then implement.

**Goal:** Apply Expressive Minimalism visual upgrades to BudgetBITCH for Gen Z (ages 14-25) — dark mode + theme customization, bold typography, bento grid dashboard, micro-interactions, and animated data visualizations — while maintaining finance-app trust and clarity.

**Architecture:** Extend existing CSS custom property theming system with `next-themes` for persistence and system-preference detection. Add Framer Motion entrance animations to dashboard panels. Replace accordion panel layout with responsive bento grid. Enhance Recharts visualizations with animated progress rings and category-consistent colors. Add confetti celebration and haptic feedback for goal milestones.

**Tech Stack:** Next.js 14 (App Router), React 19, Convex, Tailwind CSS v4, Framer Motion 12, Recharts 3, next-themes (new), Vitest + React Testing Library.

---

### Task 1: Install `next-themes` and Create Theme Provider

**Files:**
- Create: `src/components/providers/theme-provider.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `package.json`

**Step 1: Write the failing test**

```tsx
// src/components/providers/theme-provider.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from './theme-provider';

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('applies theme class to documentElement on mount', () => {
    render(<ThemeProvider><div>Children</div></ThemeProvider>);
    expect(document.documentElement.classList.contains('theme-amber')).toBe(true);
  });

  it('respects localStorage theme preference', () => {
    localStorage.setItem('budgetbitch:theme', 'dark');
    render(<ThemeProvider><div>Children</div></ThemeProvider>);
    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
  });

  it('exposes setTheme function to children', () => {
    let setThemeFn: (theme: string) => void;
    const TestChild = () => {
      setThemeFn = require('./theme-provider').useTheme().setTheme;
      return <div data-testid="child">Child</div>;
    };
    render(<ThemeProvider><TestChild /></ThemeProvider>);
    expect(typeof setThemeFn).toBe('function');
  });
});
```

**Step 2: Run test — confirm it fails**
Command: `npm run test -- src/components/providers/theme-provider.test.tsx`
Expected: FAIL — "Cannot find module './theme-provider'"

**Step 3: Write minimal implementation**

```tsx
// src/components/providers/theme-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'amber' | 'dark' | 'gold';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, defaultTheme = 'amber' }: { children: ReactNode; defaultTheme?: Theme }) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('budgetbitch:theme') as Theme | null;
    if (stored) {
      setTheme(stored);
      setResolvedTheme(stored);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setResolvedTheme('dark');
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.remove('theme-amber', 'theme-dark', 'theme-gold');
    root.classList.add(`theme-${theme}`);
    localStorage.setItem('budgetbitch:theme', theme);
    setResolvedTheme(theme);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem('budgetbitch:theme');
      if (!stored) {
        setResolvedTheme(e.matches ? 'dark' : 'amber');
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [mounted]);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

**Step 4: Run test — confirm it passes**
Command: `npm run test -- src/components/providers/theme-provider.test.tsx`
Expected: PASS

**Step 5: Install dependency and update layout**
```bash
npm i next-themes
```
```tsx
// src/app/layout.tsx (modify providers section)
import { ThemeProvider } from '@/components/providers/theme-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>...</head>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Step 6: Commit**
`git add -A && git commit -m "feat: add ThemeProvider with next-themes for dark mode + custom themes"`

---

### Task 2: Create Theme Toggle Component

**Files:**
- Create: `src/components/ui/theme-toggle.tsx`
- Create: `src/components/ui/theme-toggle.test.tsx`

**Step 1: Write the failing test**

```tsx
// src/components/ui/theme-toggle.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from './theme-toggle';
import { ThemeProvider } from '@/components/providers/theme-provider';

const renderWithProvider = (component: React.ReactNode) => render(<ThemeProvider>{component}</ThemeProvider>);

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders three theme options', () => {
    renderWithProvider(<ThemeToggle />);
    expect(screen.getByRole('button', { name: /amber/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dark/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /gold/i })).toBeInTheDocument();
  });

  it('highlights active theme', () => {
    localStorage.setItem('budgetbitch:theme', 'dark');
    renderWithProvider(<ThemeToggle />);
    const darkBtn = screen.getByRole('button', { name: /dark/i });
    expect(darkBtn).toHaveAttribute('data-active', 'true');
  });

  it('changes theme on click', () => {
    renderWithProvider(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button', { name: /gold/i }));
    expect(document.documentElement.classList.contains('theme-gold')).toBe(true);
  });
});
```

**Step 2: Run test — confirm it fails**
Command: `npm run test -- src/components/ui/theme-toggle.test.tsx`

**Step 3: Write minimal implementation**

```tsx
// src/components/ui/theme-toggle.tsx
'use client';

import { useTheme } from '@/components/providers/theme-provider';
import { cn } from '@/lib/utils/cn';

const themes: { id: 'amber' | 'dark' | 'gold'; label: string; icon: string }[] = [
  { id: 'amber', label: 'Amber', icon: '🟡' },
  { id: 'dark', label: 'Dark', icon: '⚫' },
  { id: 'gold', label: 'Gold', icon: '🟠' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
      {themes.map(t => (
        <button
          key={t.id}
          role="radio"
          aria-checked={theme === t.id}
          onClick={() => setTheme(t.id)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
            theme === t.id
              ? 'bg-white/10 text-white'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          )}
          data-active={theme === t.id ? 'true' : 'false'}
        >
          <span aria-hidden="true">{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}
```

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add -A && git commit -m "feat: add ThemeToggle component with 3 presets"`

---

### Task 3: Add Theme Toggle to Settings Page

**Files:**
- Modify: `src/app/settings/page.tsx`

**Step 1: Write the failing test**

```tsx
// src/app/settings/page.test.tsx (add to existing describe block)
it('renders ThemeToggle component', () => {
  render(<SettingsPage locale="en" />);
  expect(screen.getByRole('button', { name: /amber/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /dark/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /gold/i })).toBeInTheDocument();
});
```

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

```tsx
// src/app/settings/page.tsx (inside SettingsPage component, add to settings sections)
import { ThemeToggle } from '@/components/ui/theme-toggle';

// Add new section in the settings form:
<Section title={t('settings.appearance')} icon="🎨">
  <ThemeToggle />
</Section>
```

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add -A && git commit -m "feat: integrate ThemeToggle into Settings page"`

---

### Task 4: Create Bento Grid Dashboard Layout

**Files:**
- Create: `src/components/dashboard/bento-grid.tsx`
- Create: `src/components/dashboard/bento-grid.test.tsx`
- Modify: `src/components/dashboard/dashboard-shell.tsx`

**Step 1: Write the failing test**

```tsx
// src/components/dashboard/bento-grid.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BentoGrid } from './bento-grid';

const mockPanels = [
  { id: 'expenses', title: 'Expenses', children: <div data-testid="expenses">Expenses</div> },
  { id: 'budget', title: 'Budget', children: <div data-testid="budget">Budget</div> },
  { id: 'goals', title: 'Goals', children: <div data-testid="goals">Goals</div> },
];

describe('BentoGrid', () => {
  it('renders panels in a responsive grid', () => {
    render(<BentoGrid panels={mockPanels} />);
    const grid = screen.getByTestId('bento-grid');
    expect(grid).toHaveClass('grid');
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('md:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-3');
  });

  it('renders each panel in a card', () => {
    render(<BentoGrid panels={mockPanels} />);
    expect(screen.getByTestId('expenses')).toBeInTheDocument();
    expect(screen.getByTestId('budget')).toBeInTheDocument();
    expect(screen.getByTestId('goals')).toBeInTheDocument();
  });

  it('applies staggered animation delays via style', () => {
    render(<BentoGrid panels={mockPanels} />);
    const cards = screen.getAllByTestId(/panel-card/);
    expect(cards[0]).toHaveStyle({ '--delay': '0ms' });
    expect(cards[1]).toHaveStyle({ '--delay': '100ms' });
    expect(cards[2]).toHaveStyle({ '--delay': '200ms' });
  });
});
```

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

```tsx
// src/components/dashboard/bento-grid.tsx
'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { PanelKey } from './dashboard-shell';
import { cn } from '@/lib/utils/cn';

interface PanelConfig {
  id: PanelKey;
  title: string;
  children: React.ReactNode;
  className?: string;
}

interface BentoGridProps {
  panels: PanelConfig[];
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: custom * 0.1,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

export function BentoGrid({ panels, className }: BentoGridProps) {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <motion.div
      id="bento-grid"
      data-testid="bento-grid"
      className={cn(
        'grid gap-4',
        'grid-cols-1',
        'sm:grid-cols-2',
        'lg:grid-cols-3',
        'xl:grid-cols-4',
        className
      )}
      initial={prefersReducedMotion ? false : 'hidden'}
      animate={prefersReducedMotion ? false : 'visible'}
      variants={containerVariants}
    >
      {panels.map((panel, index) => (
        <motion.article
          key={panel.id}
          data-testid="panel-card"
          custom={index}
          variants={itemVariants}
          className={cn(
            'bb-panel relative overflow-hidden min-h-[200px]',
            panel.className
          )}
          style={{ '--delay': `${index * 100}ms` } as React.CSSProperties}
        >
          <header className="p-4 border-b border-white/5">
            <h3 className="font-medium text-white bb-kicker">{panel.title}</h3>
          </header>
          <div className="p-4">{panel.children}</div>
        </motion.article>
      ))}
    </motion.div>
  );
}
```

**Step 4: Run test — confirm it passes**

**Step 5: Update dashboard-shell.tsx to use BentoGrid** (replace accordion panels)

**Step 6: Commit**
`git add -A && git commit -m "feat: add BentoGrid dashboard layout with staggered Framer Motion entrance"`

---

### Task 5: Animated Budget Progress Rings

**Files:**
- Create: `src/components/dashboard/panels/budget-ring.tsx`
- Create: `src/components/dashboard/panels/budget-ring.test.tsx`
- Modify: `src/components/dashboard/panels/budget-visual.tsx`

**Step 1: Write the failing test**

```tsx
// src/components/dashboard/panels/budget-ring.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BudgetRing } from './budget-ring';

describe('BudgetRing', () => {
  it('renders SVG circle with correct stroke-dasharray', () => {
    render(<BudgetRing progress={0.65} size={120} strokeWidth={8} />);
    const circle = screen.getByTestId('progress-ring');
    const radius = 56; // (120 - 8) / 2
    const circumference = 2 * Math.PI * radius;
    expect(circle).toHaveAttribute('stroke-dasharray', `${circumference} ${circumference}`);
    expect(circle).toHaveAttribute('stroke-dashoffset', String(circumference * (1 - 0.65)));
  });

  it('animates progress on mount via Framer Motion', () => {
    render(<BudgetRing progress={0.65} size={120} strokeWidth={8} />);
    const circle = screen.getByTestId('progress-ring');
    expect(circle).toHaveAttribute('style', expect.stringContaining('transition'));
  });

  it('shows percentage text in center', () => {
    render(<BudgetRing progress={0.65} size={120} strokeWidth={8} />);
    expect(screen.getByText('65%')).toBeInTheDocument();
  });
});
```

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

```tsx
// src/components/dashboard/panels/budget-ring.tsx
'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface BudgetRingProps {
  progress: number; // 0-1
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
}

export function BudgetRing({ 
  progress, 
  size = 120, 
  strokeWidth = 8, 
  className,
  label 
}: BudgetRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const offset = circumference * (1 - clampedProgress);

  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-white/10"
          />
          <motion.circle
            data-testid="progress-ring"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#budget-gradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            initial={prefersReducedMotion ? false : { strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ filter: 'drop-shadow(0 4px 12px rgba(157, 202, 183, 0.4))' }}
          />
          <defs>
            <linearGradient id="budget-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--accent-strong)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bb-metric-value" style={{ fontSize: size * 0.18 }}>
            {Math.round(clampedProgress * 100)}%
          </span>
        </div>
      </div>
      {label && <p className="bb-copy text-center">{label}</p>}
    </div>
  );
}
```

**Step 4: Run test — confirm it passes**

**Step 5: Integrate into budget-visual.tsx** (replace/add to existing BudgetVisual)

**Step 6: Commit**
`git add -A && git commit -m "feat: add animated BudgetRing component with Framer Motion"`

---

### Task 6: Confetti Celebration on Savings Goal

**Files:**
- Create: `src/components/ui/confetti.tsx`
- Create: `src/components/ui/confetti.test.tsx`
- Modify: `src/components/dashboard/panels/savings-goals.tsx`

**Step 1: Write the failing test**

```tsx
// src/components/ui/confetti.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Confetti } from './confetti';

describe('Confetti', () => {
  it('renders canvas when active', () => {
    render(<Confetti isActive={true} duration={100} />);
    expect(screen.getByTestId('confetti-canvas')).toBeInTheDocument();
  });

  it('does not render when inactive', () => {
    render(<Confetti isActive={false} />);
    expect(screen.queryByTestId('confetti-canvas')).not.toBeInTheDocument();
  });

  it('calls onComplete callback after duration', async () => {
    const onComplete = vi.fn();
    render(<Confetti isActive={true} duration={50} onComplete={onComplete} />);
    await waitFor(() => expect(onComplete).toHaveBeenCalled(), { timeout: 200 });
  });
});
```

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation** (lightweight canvas confetti, no external deps)

```tsx
// src/components/ui/confetti.tsx
'use client';

import { useEffect, useRef, useCallback } from 'react';

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  onComplete?: () => void;
  colorPalette?: string[];
}

export function Confetti({ 
  isActive, 
  duration = 3000, 
  onComplete,
  colorPalette = ['#9dcab7', '#ccb37a', '#f5d742', '#6b7280', '#ffffff']
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const particles = useRef<Array<{
    x: number; y: number; vx: number; vy: number; 
    color: string; size: number; rotation: number; rotationSpeed: number;
  }>>([]);

  const initParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    particles.current = Array.from({ length: 80 }, () => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 10 - 5,
      color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
    }));
  }, [colorPalette]);

  const animate = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let allDead = true;
    particles.current.forEach(p => {
      if (p.y < canvas.height + 20) {
        allDead = false;
        p.vy += 0.3; // gravity
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    if (!allDead) {
      animationRef.current = requestAnimationFrame(() => animate(ctx, canvas));
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    initParticles();

    let completed = false;
    const timeout = setTimeout(() => {
      completed = true;
      onComplete?.();
    }, duration);

    animationRef.current = requestAnimationFrame(() => animate(ctx, canvas));

    return () => {
      window.removeEventListener('resize', resize);
      clearTimeout(timeout);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, duration, onComplete, animate, initParticles]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      data-testid="confetti-canvas"
      className="fixed inset-0 pointer-events-none z-50"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
```

**Step 4: Run test — confirm it passes**

**Step 5: Integrate into savings-goals.tsx** — trigger when goal reaches 100%

**Step 6: Commit**
`git add -A && git commit -m "feat: add confetti celebration for savings goal completion"`

---

### Task 7: Haptic Feedback for Mobile Interactions

**Files:**
- Create: `src/hooks/use-haptic.ts`
- Create: `src/hooks/use-haptic.test.ts`
- Modify: `src/components/ui/toggle.tsx`, `src/components/ui/input.tsx`, `src/components/ui/select.tsx`

**Step 1: Write the failing test**

```ts
// src/hooks/use-haptic.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useHaptic } from './use-haptic';

const mockNavigator = vi.fn();

describe('useHaptic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore
    global.navigator = { vibrate: mockNavigator };
  });

  it('returns trigger function', () => {
    const { trigger } = useHaptic();
    expect(typeof trigger).toBe('function');
  });

  it('calls navigator.vibrate with pattern', () => {
    const { trigger } = useHaptic();
    trigger('light');
    expect(mockNavigator).toHaveBeenCalledWith(10);
  });

  it('does nothing when vibration API unavailable', () => {
    // @ts-ignore
    delete global.navigator.vibrate;
    const { trigger } = useHaptic();
    expect(() => trigger('medium')).not.toThrow();
  });
});
```

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

```ts
// src/hooks/use-haptic.ts
import { useCallback } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

const patterns: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 40,
  selection: [5, 5, 5],
  success: [10, 50, 10],
  warning: [20, 100, 20],
  error: [30, 30, 30, 30, 30],
};

export function useHaptic() {
  const trigger = useCallback((type: HapticType = 'light') => {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate(patterns[type]);
    } catch {
      // Silently fail if vibration not supported
    }
  }, []);

  return { trigger };
}
```

**Step 4: Run test — confirm it passes**

**Step 5: Add haptic feedback to key UI components** (toggle.tsx, input.tsx on blur, select.tsx on change)

**Step 6: Commit**
`git add -A && git commit -m "feat: add useHaptic hook and integrate into form components"`

---

### Task 8: Enhanced Recharts Visualizations with Category Colors

**Files:**
- Modify: `src/components/dashboard/panels/expense-tracker.tsx`
- Modify: `src/components/dashboard/panels/budget-visual.tsx`
- Create: `src/lib/colors/category-colors.ts`

**Step 1: Write the failing test**

```tsx
// src/lib/colors/category-colors.test.ts
import { describe, it, expect } from 'vitest';
import { getCategoryColor, CATEGORY_COLORS } from './category-colors';

describe('Category Colors', () => {
  it('returns consistent color for each category', () => {
    expect(getCategoryColor('food')).toBe('#f59e0b'); // amber
    expect(getCategoryColor('transport')).toBe('#3b82f6'); // blue
    expect(getCategoryColor('entertainment')).toBe('#8b5cf6'); // purple
    expect(getCategoryColor('utilities')).toBe('#06b6d4'); // cyan
  });

  it('falls back to default for unknown category', () => {
    expect(getCategoryColor('unknown')).toBe('#6b7280'); // gray
  });

  it('exports all category colors as array for Recharts', () => {
    expect(CATEGORY_COLORS).toHaveLength(8);
    expect(CATEGORY_COLORS).toContain('#f59e0b');
  });
});
```

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

```ts
// src/lib/colors/category-colors.ts
export const CATEGORY_COLOR_MAP: Record<string, string> = {
  food: '#f59e0b',
  transport: '#3b82f6',
  entertainment: '#8b5cf6',
  utilities: '#06b6d4',
  healthcare: '#ef4444',
  phone_internet: '#ec4899',
  shopping: '#f97316',
  other: '#6b7280',
};

export const CATEGORY_COLORS = Object.values(CATEGORY_COLOR_MAP);

export function getCategoryColor(category: string): string {
  return CATEGORY_COLOR_MAP[category] || '#6b7280';
}

export function getCategoryColors(categories: string[]): string[] {
  return categories.map(getCategoryColor);
}
```

**Step 4: Run test — confirm it passes**

**Step 5: Update expense-tracker.tsx and budget-visual.tsx to use category colors in Recharts** (PieChart, BarChart color prop)

**Step 6: Commit**
`git add -A && git commit -m "feat: add category-consistent color palette for Recharts visualizations"`

---

### Task 9: Responsive Typography Scale + Display Font

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx` (add font loading)

**Step 1: Write the failing test**

```ts
// src/app/globals.css (verify via visual regression or computed style test)
```

**Step 2: Run test — confirm it fails** (manual visual check or CSS parsed test)

**Step 3: Write minimal implementation**

```css
/* src/app/globals.css - Add to :root and @layer base */

/* Font loading - Inter + Space Grotesk (display) */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

:root {
  /* ... existing ... */
  --font-body: "Inter", system-ui, sans-serif;
  --font-display: "Space Grotesk", "Inter", system-ui, sans-serif;
  
  /* Fluid typography scale */
  --text-xs: clamp(0.7rem, 0.65rem + 0.25vw, 0.75rem);
  --text-sm: clamp(0.85rem, 0.8rem + 0.25vw, 0.9rem);
  --text-base: clamp(1rem, 0.95rem + 0.25vw, 1.05rem);
  --text-lg: clamp(1.15rem, 1.05rem + 0.5vw, 1.3rem);
  --text-xl: clamp(1.4rem, 1.2rem + 1vw, 1.75rem);
  --text-2xl: clamp(1.8rem, 1.5rem + 1.5vw, 2.5rem);
  --text-3xl: clamp(2.25rem, 1.8rem + 2.25vw, 3.5rem);
  --text-4xl: clamp(3rem, 2.25rem + 3.75vw, 5rem);
}

/* Update heading styles */
@layer base {
  h1 {
    font-size: var(--text-4xl);
    font-weight: 700;
    line-height: 1.05;
  }
  h2 {
    font-size: var(--text-3xl);
    font-weight: 700;
    line-height: 1.1;
  }
  h3 {
    font-size: var(--text-2xl);
    font-weight: 600;
    line-height: 1.2;
  }
  h4 {
    font-size: var(--text-xl);
    font-weight: 600;
    line-height: 1.3;
  }
  .bb-kicker {
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }
  .bb-metric-value {
    font-family: var(--font-display);
    font-size: var(--text-3xl);
  }
}
```

**Step 4: Verify visually / run lint**

**Step 5: Commit**
`git add -A && git commit -m "feat: upgrade typography scale with Space Grotesk display font and fluid clamp"`

---

### Task 10: Motion Utilities + Reduced Motion Respect

**Files:**
- Create: `src/lib/animation/motion-utils.ts`
- Modify: All Framer Motion components to use utilities

**Step 1: Write the failing test**

```ts
// src/lib/animation/motion-utils.test.ts
import { describe, it, expect } from 'vitest';
import { getTransition, prefersReducedMotion } from './motion-utils';

describe('Motion Utils', () => {
  it('returns standard transition', () => {
    const t = getTransition();
    expect(t.duration).toBe(0.4);
    expect(t.ease).toEqual([0.25, 0.46, 0.45, 0.94]);
  });

  it('returns reduced motion transition when preferred', () => {
    // Mock matchMedia
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    expect(prefersReducedMotion()).toBe(true);
  });
});
```

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

```ts
// src/lib/animation/motion-utils.ts
import { Transition } from 'framer-motion';

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const transitions = {
  spring: { type: 'spring', stiffness: 260, damping: 20 } as Transition,
  easeOut: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } as Transition,
  easeInOut: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } as Transition,
  quick: { duration: 0.15, ease: [0.4, 0, 0.2, 1] } as Transition,
};

export function getTransition(type: keyof typeof transitions = 'easeOut'): Transition {
  if (prefersReducedMotion()) {
    return { duration: 0.01, ease: 'linear' };
  }
  return transitions[type];
}

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

export const staggerItem = (index: number) => ({
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...transitions.easeOut, delay: index * 0.1 },
  },
});
```

**Step 4: Run test — confirm it passes**

**Step 5: Refactor existing Framer Motion components to use these utilities**

**Step 6: Commit**
`git add -A && git commit -m "feat: add motion utilities with reduced-motion support"`

---

### Task 11: Final Polish & Accessibility Audit

**Files:**
- Modify: Various components for ARIA labels, focus states
- Run: Full test suite, lint, build

**Step 1: Run full test suite**
Command: `npm run test`
Expected: All tests pass

**Step 2: Run lint**
Command: `npm run lint`
Expected: No errors

**Step 3: Run build**
Command: `npm run build`
Expected: Successful build

**Step 4: Manual accessibility check**
- Tab through all interactive elements
- Verify focus-visible outlines
- Test with screen reader (NVDA/VoiceOver)
- Verify color contrast ratios (WCAG AA)

**Step 5: Commit**
`git add -A && git commit -m "chore: final polish - accessibility, lint, build verification"`

---

## Execution Order

1. Tasks 1-3: Theme system foundation (provider, toggle, settings integration)
2. Task 4: Bento grid layout (major structural change)
3. Tasks 5-6: Visual delight (progress rings, confetti)
4. Task 7: Haptic feedback (mobile UX)
5. Task 8: Data visualization consistency
6. Task 9: Typography upgrade
7. Task 10: Motion system hardening
8. Task 11: Final verification

---

## Verification Commands

```bash
# After each task
npm run test -- <specific-test-file>
npm run lint

# After all tasks
npm run test
npm run lint
npm run build
```

---

## Rollback Plan

If any task breaks existing functionality:
1. `git revert <commit-hash>` for that task
2. Re-run full test suite
3. Investigate and fix in separate branch

---

**Plan saved to `docs/plans/2025-08-24-expressive-minimalism-visual-upgrade.md`. Two execution options:**

1. **Subagent-Driven** — I dispatch a fresh sub-agent per task, review between tasks
2. **Manual** — You run the tasks yourself

**Which approach?**