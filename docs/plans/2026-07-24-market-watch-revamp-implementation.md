# Market Watch Revamp — Implementation Plan

> **For implementer:** Use TDD throughout. Write failing test first. Watch it fail. Then implement.

---

## Goal

Transform the Market Watch panel into a vicinity-aware, delightfully animated feed with budget-tip skeletons, Lottie/Rive animations, and tiered feed selection.

---

## Architecture

- **Resolver**: `lib/news/vicinity-resolver.ts` — Haversine distance + tiered feed registry (city → province → country → region → global)
- **API**: `/api/news/vicinity/route.ts` — Accepts lat/lon, returns sorted deduplicated items
- **Hook**: `hooks/use-vicinity-feeds.ts` — Client-side fetch with 6h cache, pull-to-refresh
- **UI**: `AnimatedFeedList` + `FeedCard` + `BudgetTipSkeleton` — Framer Motion stagger, Lottie/Rive states
- **Integration**: Swap `AlertsSidebar` list to `AnimatedFeedList`

---

## Tech Stack

- Next.js 16 App Router, React 19, TypeScript
- Framer Motion (already in deps)
- lottie-react (new), @rive-app/canvas (new)
- rss-parser (existing)
- Vitest + React Testing Library + Playwright

---

## Task Breakdown

### Task 1: Vicinity Feed Resolver (lib)

**Files:**
- Create: `lib/news/vicinity-resolver.ts`
- Create: `lib/news/vicinity-registry.ts`
- Test: `lib/news/vicinity-resolver.test.ts`

**Step 1: Write failing test**

```typescript
// lib/news/vicinity-resolver.test.ts
import { haversineKm, resolveVicinityFeeds } from '@/lib/news/vicinity-resolver';

export async function runTests() {
  // Test haversine accuracy
  const bkkToPattaya = haversineKm(13.7563, 100.5018, 12.9236, 100.8825);
  assert.ok(bkkToPattaya > 100 && bkkToPattaya < 150, `Expected ~130km, got ${bkkToPattaya}`);

  const bkkToPhuket = haversineKm(13.7563, 100.5018, 7.8861, 98.3926);
  assert.ok(bkkToPhuket > 650 && bkkToPhuket < 750, `Expected ~680km, got ${bkkToPhuket}`);

  // Test tier ordering for Bangkok
  const feeds = resolveVicinityFeeds(13.7563, 100.5018, 'TH');
  const tiers = feeds.map(f => f.tier);
  
  // Should have city tier first (Bangkok feeds)
  const cityFeeds = feeds.filter(f => f.tier === 'city');
  assert.ok(cityFeeds.length > 0, 'Should have city feeds for Bangkok');
  
  // Should have country feeds
  const countryFeeds = feeds.filter(f => f.tier === 'country');
  assert.ok(countryFeeds.length > 0, 'Should have country feeds for TH');
  
  // Should have region feeds (SEA)
  const regionFeeds = feeds.filter(f => f.tier === 'region');
  assert.ok(regionFeeds.length > 0, 'Should have region feeds for SEA');
  
  // Should have global fallback
  const globalFeeds = feeds.filter(f => f.tier === 'global');
  assert.ok(globalFeeds.length > 0, 'Should have global fallback feeds');

  // Test tier ordering: city < province < country < region < global
  const firstCity = feeds.findIndex(f => f.tier === 'city');
  const firstCountry = feeds.findIndex(f => f.tier === 'country');
  const firstRegion = feeds.findIndex(f => f.tier === 'region');
  const firstGlobal = feeds.findIndex(f => f.tier === 'global');
  
  assert.ok(firstCity < firstCountry, 'City feeds before country');
  assert.ok(firstCountry < firstRegion, 'Country feeds before region');
  assert.ok(firstRegion < firstGlobal, 'Region feeds before global');

  // Test max 12 feeds
  assert.ok(feeds.length <= 12, 'Should cap at 12 feeds');

  console.log('✅ vicinity-resolver tests passed');
}
```

**Step 2: Run test — confirm it fails**
```bash
npm test -- --filter=vicinity-resolver
# Expected: FAIL — module not found
```

**Step 3: Write minimal implementation**

Create `lib/news/vicinity-registry.ts` with TIERED_FEED_REGISTRY (copy from design doc)

Create `lib/news/vicinity-resolver.ts` with:
- `haversineKm()` function
- `resolveVicinityFeeds(lat, lon, country)` function
- `getRegionForCountry()` helper

**Step 4: Run test — confirm it passes**
```bash
npm test -- --filter=vicinity-resolver
# Expected: PASS
```

**Step 5: Commit**
```bash
git add lib/news/vicinity-registry.ts lib/news/vicinity-resolver.ts lib/news/vicinity-resolver.test.ts
git commit -m "feat: add vicinity feed resolver with tiered registry"
```

---

### Task 2: Vicinity News API Route

**Files:**
- Create: `app/api/news/vicinity/route.ts`
- Test: `tests/integration/market-watch-api.test.ts`

**Step 1: Write failing test**

```typescript
// tests/integration/market-watch-api.test.ts
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/news/vicinity/route';

export async function runTests() {
  // Mock rss-parser to avoid network calls
  jest.mock('rss-parser', () => {
    return jest.fn().mockImplementation(() => ({
      parseURL: jest.fn().mockResolvedValue({
        items: [
          { title: 'Test News', link: 'https://example.com/1', pubDate: new Date().toISOString() },
          { title: 'Fuel price drop', link: 'https://example.com/2', pubDate: new Date().toISOString() },
        ]
      })
    }));
  });

  const request = new NextRequest(new URL('http://localhost/api/news/vicinity?lat=13.7563&lon=100.5018&locale=th&country=TH'));
  const response = await GET(request);
  const data = await response.json();

  assert.ok(response.ok, 'Should return 200');
  assert.ok(Array.isArray(data.items), 'Should return items array');
  assert.ok(data.items.length > 0, 'Should have items');
  
  // Check actionable text for fuel
  const fuelItem = data.items.find((i: any) => i.title.includes('Fuel'));
  assert.ok(fuelItem?.actionable?.includes('เช็คราคาน้ำมัน'), 'Should have Thai actionable text for fuel');

  console.log('✅ market-watch-api tests passed');
}
```

**Step 2: Run test — confirm it fails**
```bash
npm test -- --filter=market-watch-api
# Expected: FAIL — route not found
```

**Step 3: Write implementation**

Create `app/api/news/vicinity/route.ts`:
- Import `resolveVicinityFeeds` from `@/lib/news/vicinity-resolver`
- Import `Parser` from `rss-parser`
- GET handler: parse lat/lon/locale/country, call resolver, fetch feeds in parallel, dedupe, return JSON

**Step 4: Run test — confirm it passes**
```bash
npm test -- --filter=market-watch-api
# Expected: PASS
```

**Step 5: Commit**
```bash
git add app/api/news/vicinity/route.ts tests/integration/market-watch-api.test.ts
git commit -m "feat: add vicinity news API route"
```

---

### Task 3: useVicinityFeeds Hook

**Files:**
- Create: `hooks/use-vicinity-feeds.ts`
- Test: `hooks/use-vicinity-feeds.test.tsx`

**Step 1: Write failing test**

```typescript
// hooks/use-vicinity-feeds.test.tsx
import { renderHook, act, waitFor } from '@testing-library/react';
import { useVicinityFeeds } from '@/hooks/use-vicinity-feeds';
import { useResolvedLocation } from '@/hooks/use-resolved-location';

// Mock useResolvedLocation
jest.mock('@/hooks/use-resolved-location', () => ({
  useResolvedLocation: () => ({
    location: { lat: 13.7563, lon: 100.5018 },
    country: 'TH',
  }),
}));

// Mock fetch
global.fetch = jest.fn();

export async function runTests() {
  const mockItems = [
    { title: 'News 1', link: 'https://a.com', pubDate: new Date().toISOString(), source: 'Test', category: 'finance', locale: 'th', actionable: 'Tip 1' },
    { title: 'News 2', link: 'https://b.com', pubDate: new Date().toISOString(), source: 'Test', category: 'fuel', locale: 'th' },
  ];

  (fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ items: mockItems }),
  });

  const { result } = renderHook(() => useVicinityFeeds('th'));

  // Should start loading
  assert.ok(result.current.loading, 'Should be loading initially');

  // Wait for fetch
  await waitFor(() => expect(result.current.loading).toBe(false));

  assert.ok(!result.current.loading, 'Should not be loading after fetch');
  assert.ok(result.current.items.length === 2, 'Should have 2 items');
  assert.ok(result.current.items[0].actionable === 'Tip 1', 'First item should have actionable');
  assert.ok(result.current.lastUpdated > 0, 'Should have lastUpdated timestamp');

  // Test refresh
  (fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ items: [...mockItems, { title: 'News 3', link: 'https://c.com', pubDate: new Date().toISOString(), source: 'Test', category: 'deals', locale: 'th', actionable: 'Deal!' }] }),
  });

  await act(async () => {
    await result.current.refresh();
  });

  assert.ok(result.current.items.length === 3, 'Should have 3 items after refresh');

  console.log('✅ use-vicinity-feeds tests passed');
}
```

**Step 2: Run test — confirm it fails**
```bash
npm test -- --filter=use-vicinity-feeds
# Expected: FAIL — hook not found
```

**Step 3: Write implementation**

Create `hooks/use-vicinity-feeds.ts`:
- Use `useResolvedLocation` from `./use-resolved-location`
- State: items, loading, error, lastUpdated
- `fetchNews()` calls `/api/news/vicinity` with lat/lon/locale/country
- 6h localStorage cache with fallback on error
- `refresh()` function exposed

**Step 4: Run test — confirm it passes**
```bash
npm test -- --filter=use-vicinity-feeds
# Expected: PASS
```

**Step 5: Commit**
```bash
git add hooks/use-vicinity-feeds.ts hooks/use-vicinity-feeds.test.tsx
git commit -m "feat: add useVicinityFeeds hook with caching and refresh"
```

---

### Task 4: BudgetTipSkeleton Component

**Files:**
- Create: `components/dashboard/budget-tip-skeleton.tsx`
- Test: `components/dashboard/budget-tip-skeleton.test.tsx`

**Step 1: Write failing test**

```typescript
// components/dashboard/budget-tip-skeleton.test.tsx
import { render, screen } from '@testing-library/react';
import { BudgetTipSkeleton } from '@/components/dashboard/budget-tip-skeleton';

export async function runTests() {
  const tips = ['Tip 1', 'Tip 2', 'Tip 3'];
  
  render(<BudgetTipSkeleton tips={tips} count={2} />);

  // Should render 2 skeleton divs
  const skeletons = screen.getAllByRole('status');
  assert.ok(skeletons.length >= 2, 'Should render skeleton placeholders');

  // Should show tip text (rotating)
  assert.ok(screen.getByText('Tip 1') || screen.getByText('Tip 2') || screen.getByText('Tip 3'), 'Should show a budget tip');

  console.log('✅ budget-tip-skeleton tests passed');
}
```

**Step 2: Run test — confirm it fails**
```bash
npm test -- --filter=budget-tip-skeleton
# Expected: FAIL — component not found
```

**Step 3: Write implementation**

Create `components/dashboard/budget-tip-skeleton.tsx`:
- `useState` for current tip index
- `useEffect` interval rotating every 3s
- Render `count` motion.div skeletons with Framer Motion entrance
- Render rotating tip text with AnimatePresence

**Step 4: Run test — confirm it passes**
```bash
npm test -- --filter=budget-tip-skeleton
# Expected: PASS
```

**Step 5: Commit**
```bash
git add components/dashboard/budget-tip-skeleton.tsx components/dashboard/budget-tip-skeleton.test.tsx
git commit -m "feat: add BudgetTipSkeleton with rotating tips"
```

---

### Task 5: FeedCard Component

**Files:**
- Create: `components/dashboard/feed-card.tsx`
- Test: `components/dashboard/feed-card.test.tsx`

**Step 1: Write failing test**

```typescript
// components/dashboard/feed-card.test.tsx
import { render, screen } from '@testing-library/react';
import { FeedCard } from '@/components/dashboard/feed-card';

export async function runTests() {
  const item = {
    title: 'Fuel prices drop tomorrow',
    link: 'https://example.com/fuel',
    pubDate: new Date().toISOString(),
    source: 'Bangkok Post',
    category: 'fuel' as const,
    locale: 'th' as const,
    actionable: 'เช็คราคาน้ำมันก่อนเติม',
  };

  render(<FeedCard item={item} locale="th" index={0} />);

  // Should render title
  assert.ok(screen.getByText('Fuel prices drop tomorrow'), 'Should show title');
  
  // Should render category badge
  assert.ok(screen.getByText('น้ำมัน'), 'Should show Thai category label');
  
  // Should render source
  assert.ok(screen.getByText('Bangkok Post'), 'Should show source');
  
  // Should render actionable badge
  assert.ok(screen.getByText('เช็คราคาน้ำมันก่อนเติม'), 'Should show actionable text');
  
  // Should have read more link
  const link = screen.getByRole('link', { name: /อ่านต่อ/i });
  assert.ok(link.href === 'https://example.com/fuel', 'Link should have correct href');

  console.log('✅ feed-card tests passed');
}
```

**Step 2: Run test — confirm it fails**
```bash
npm test -- --filter=feed-card
# Expected: FAIL — component not found
```

**Step 3: Write implementation**

Create `components/dashboard/feed-card.tsx`:
- Framer Motion `motion.article` with hover lift + shimmer sweep
- Category icon mapping
- Actionable badge with pulse animation
- Read more external link

**Step 4: Run test — confirm it passes**
```bash
npm test -- --filter=feed-card
# Expected: PASS
```

**Step 5: Commit**
```bash
git add components/dashboard/feed-card.tsx components/dashboard/feed-card.test.tsx
git commit -m "feat: add animated FeedCard with actionable pulse"
```

---

### Task 6: AnimatedFeedList Component

**Files:**
- Create: `components/dashboard/animated-feed-list.tsx`
- Test: `components/dashboard/animated-feed-list.test.tsx`

**Step 1: Write failing test**

```typescript
// components/dashboard/animated-feed-list.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { AnimatedFeedList } from '@/components/dashboard/animated-feed-list';
import { useVicinityFeeds } from '@/hooks/use-vicinity-feeds';

jest.mock('@/hooks/use-vicinity-feeds');

export async function runTests() {
  const mockItems = [
    { title: 'News 1', link: 'https://a.com', pubDate: new Date().toISOString(), source: 'Test', category: 'finance', locale: 'th', actionable: 'Tip 1' },
    { title: 'News 2', link: 'https://b.com', pubDate: new Date().toISOString(), source: 'Test', category: 'fuel', locale: 'th' },
  ];

  (useVicinityFeeds as jest.Mock).mockReturnValue({
    items: mockItems,
    loading: false,
    error: null,
    lastUpdated: Date.now(),
    refresh: jest.fn(),
  });

  render(<AnimatedFeedList locale="th" />);

  // Should render feed cards
  await waitFor(() => {
    expect(screen.getByText('News 1')).toBeInTheDocument();
    expect(screen.getByText('News 2')).toBeInTheDocument();
  });

  // Should have category badges
  assert.ok(screen.getByText('Finance'), 'Should show Finance category');
  assert.ok(screen.getByText('น้ำมัน'), 'Should show Thai fuel label');

  // Test empty state (no location)
  (useVicinityFeeds as jest.Mock).mockReturnValue({
    items: [],
    loading: false,
    error: null,
    lastUpdated: null,
    refresh: jest.fn(),
  });

  render(<AnimatedFeedList locale="en" />);
  assert.ok(screen.getByText(/Enable location/i), 'Should show enable location CTA');

  console.log('✅ animated-feed-list tests passed');
}
```

**Step 2: Run test — confirm it fails**
```bash
npm test -- --filter=animated-feed-list
# Expected: FAIL — component not found
```

**Step 3: Write implementation**

Create `components/dashboard/animated-feed-list.tsx`:
- Import `useVicinityFeeds`, `FeedCard`, `BudgetTipSkeleton`
- Loading state: Lottie shimmer + BudgetTipSkeleton
- Empty (no location): Lottie tuk-tuk + enable location button
- Empty (no items): Lottie coin jar + retry button
- Error: Lottie signal lost + retry button
- Success: Framer Motion container with staggerChildren + FeedCard mapping
- Pull-to-refresh touch handlers + coin drop animation

**Step 4: Run test — confirm it passes**
```bash
npm test -- --filter=animated-feed-list
# Expected: PASS
```

**Step 5: Commit**
```bash
git add components/dashboard/animated-feed-list.tsx components/dashboard/animated-feed-list.test.tsx
git commit -m "feat: add AnimatedFeedList with all states and pull-to-refresh"
```

---

### Task 7: Update AlertsSidebar

**Files:**
- Modify: `components/dashboard/alerts-sidebar.tsx`
- Test: `components/dashboard/alerts-sidebar.test.tsx` (update existing)

**Step 1: Write failing test**

```typescript
// components/dashboard/alerts-sidebar.test.tsx (add to existing)
import { render, screen } from '@testing-library/react';
import { AlertsSidebar } from '@/components/dashboard/alerts-sidebar';
import { useVicinityFeeds } from '@/hooks/use-vicinity-feeds';

jest.mock('@/hooks/use-vicinity-feeds');

export async function runTests() {
  (useVicinityFeeds as jest.Mock).mockReturnValue({
    items: [
      { title: 'Test News', link: 'https://a.com', pubDate: new Date().toISOString(), source: 'Test', category: 'finance', locale: 'th' },
    ],
    loading: false,
    error: null,
    lastUpdated: Date.now(),
    refresh: jest.fn(),
  });

  render(<AlertsSidebar locale="th" />);

  // Should render heading
  assert.ok(screen.getByText('ข่าวและข้อมูลล่าสุด'), 'Should show Thai heading');
  
  // Should render feed card via AnimatedFeedList
  assert.ok(screen.getByText('Test News'), 'Should show feed item');

  console.log('✅ alerts-sidebar integration tests passed');
}
```

**Step 2: Run test — confirm it fails**
```bash
npm test -- --filter=alerts-sidebar
# Expected: FAIL — still using old list
```

**Step 3: Write implementation**

Modify `components/dashboard/alerts-sidebar.tsx`:
- Remove inline fetch logic
- Import `AnimatedFeedList` from `./animated-feed-list`
- Render `<AnimatedFeedList locale={locale} />` inside
- Keep heading and modal prop handling

**Step 4: Run test — confirm it passes**
```bash
npm test -- --filter=alerts-sidebar
# Expected: PASS
```

**Step 5: Commit**
```bash
git add components/dashboard/alerts-sidebar.tsx components/dashboard/alerts-sidebar.test.tsx
git commit -m "feat: integrate AnimatedFeedList into AlertsSidebar"
```

---

### Task 8: Install Dependencies & Add Animations

**Files:**
- Modify: `package.json`
- Add: `public/animations/loading-gold-shimmer.json`
- Add: `public/animations/empty-tuk-tuk.json`
- Add: `public/animations/empty-coin-jar.json`
- Add: `public/animations/error-signal-lost.json`
- Add: `public/animations/refresh-coin-drop.riv`

**Step 1: Install dependencies**

```bash
npm install lottie-react @rive-app/canvas
```

**Step 2: Verify install**

```bash
npm test -- --filter=animated-feed-list
# Should pass with Lottie imports
```

**Step 3: Add animation files**

Place commissioned Lottie/Rive files in `public/animations/`

**Step 4: Commit**
```bash
git add package.json package-lock.json public/animations/
git commit -m "chore: add Lottie/Rive dependencies and animation assets"
```

---

### Task 9: E2E Tests

**Files:**
- Create: `tests/e2e/market-watch.spec.ts`

**Step 1: Write test**

```typescript
// tests/e2e/market-watch.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Market Watch', () => {
  test('loads vicinity feeds for Bangkok', async ({ page }) => {
    // Mock geolocation
    await page.context().grantPermissions(['geolocation']);
    await page.setGeolocation({ latitude: 13.7563, longitude: 100.5018 });
    
    await page.goto('/');
    await page.waitForSelector('[data-testid="market-watch-trigger"]');
    await page.click('[data-testid="market-watch-trigger"]');
    
    // Check loading animation appears
    await expect(page.locator('lottie-player').first()).toBeVisible({ timeout: 5000 });
    
    // Wait for feed cards
    await page.waitForSelector('[data-testid="feed-card"]', { timeout: 10000 });
    const cards = await page.locator('[data-testid="feed-card"]').all();
    expect(cards.length).toBeGreaterThan(0);
    
    // Check category badge
    await expect(page.locator('text=Finance').first()).toBeVisible();
    
    // Check actionable badge
    await expect(page.locator('[data-testid="actionable-badge"]').first()).toBeVisible();
  });

  test('shows empty state when location denied', async ({ page }) => {
    await page.context().clearPermissions();
    await page.goto('/');
    await page.click('[data-testid="market-watch-trigger"]');
    
    await expect(page.locator('text=Enable location')).toBeVisible({ timeout: 5000 });
  });
});
```

**Step 2: Run test — confirm it fails**
```bash
npm run test:e2e -- market-watch.spec.ts
# Expected: FAIL — components need data-testid attributes
```

**Step 3: Add data-testid to components**

Add `data-testid="feed-card"` to FeedCard
Add `data-testid="actionable-badge"` to actionable element
Add `data-testid="market-watch-trigger"` to Market Watch button in dashboard-shell

**Step 4: Run test — confirm it passes**
```bash
npm run test:e2e -- market-watch.spec.ts
# Expected: PASS
```

**Step 5: Commit**
```bash
git add tests/e2e/market-watch.spec.ts components/dashboard/feed-card.tsx components/dashboard/dashboard-shell.tsx
git commit -m "test: add E2E tests for Market Watch vicinity feeds"
```

---

### Task 10: Full Verification

**Commands:**
```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

**Expected:** All pass

**Commit:**
```bash
git add -A
git commit -m "chore: verify Market Watch revamp — all checks pass"
```

---

## Summary

| Task | Component | Est. Time |
|------|-----------|-----------|
| 1 | Vicinity Resolver | 30 min |
| 2 | API Route | 30 min |
| 3 | useVicinityFeeds Hook | 30 min |
| 4 | BudgetTipSkeleton | 20 min |
| 5 | FeedCard | 20 min |
| 6 | AnimatedFeedList | 45 min |
| 7 | AlertsSidebar Integration | 15 min |
| 8 | Dependencies & Animations | 15 min |
| 9 | E2E Tests | 30 min |
| 10 | Full Verification | 15 min |

**Total: ~4.5 hours**

---

## Execution Options

1. **Subagent-Driven** — I dispatch a fresh sub-agent per task, review between tasks
2. **Manual** — You run the tasks yourself

Which approach?