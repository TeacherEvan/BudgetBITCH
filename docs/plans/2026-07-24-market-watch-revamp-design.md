# Market Watch Revamp — Design Document

> **For implementer:** Use TDD throughout. Write failing test first. Watch it fail. Then implement.

---

## Goal

Transform the Market Watch panel from a basic RSS list into a **vicinity-aware, delightfully animated** feed that surfaces locally relevant financial news (fuel prices, deals, policy changes) with app-themed visual surprises.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      AlertsSidebar (client)                     │
│  ┌──────────────────┐  ┌────────────────────────────────────┐  │
│  │ useVicinityFeeds │  │ VicinityFeedResolver (lib)         │  │
│  │   (hook)         │──│  • resolveVicinityFeeds(lat, lon)  │  │
│  └──────────────────┘  │  • TIERED_FEED_REGISTRY            │  │
│         │              │  • Haversine distance sorting      │  │
│         ▼              └────────────────────────────────────┘  │
│  ┌──────────────────┐                                         │
│  │ AnimatedFeedList │  • Framer Motion staggered entrance    │
│  │   (component)    │  • Lottie/Rive loaders & empty states  │
│  └──────────────────┘  • Budget tips rotation in skeletons   │
│         │              • Pull-to-refresh coin animation      │
│         ▼                                                         │
│  ┌──────────────────┐                                         │
│  │ FeedCard         │  • Category icon + gold accent ring    │
│  │ (animated)       │  • Actionable badge pulse              │
│  │                  │  • Hover/tap scale + shimmer           │
│  └──────────────────┘                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Vicinity Feed Resolver (`lib/news/vicinity-resolver.ts`)

### Tiered Feed Registry

```typescript
interface VicinityFeed {
  url: string;
  locale: 'th' | 'en';
  category: NewsItem['category'];
  source: string;
  // Center point for distance calculation
  center: { lat: number; lon: number };
  // Radius in km — feeds within this distance qualify
  radiusKm: number;
  // Priority within same tier (lower = shown first)
  priority: number;
  // Feed reliability score (0-1) for sorting ties
  reliability: number;
}

type Tier = 'city' | 'province' | 'country' | 'region' | 'global';

const TIERED_FEED_REGISTRY: Record<Tier, VicinityFeed[]> = {
  city: [
    // Bangkok example — extend per major city
    { url: 'https://www.bangkokpost.com/rss/data/business.xml', locale: 'th', category: 'finance', source: 'Bangkok Post Business', center: { lat: 13.7563, lon: 100.5018 }, radiusKm: 30, priority: 1, reliability: 0.95 },
    { url: 'https://englishnews.thaipbs.or.th/rss', locale: 'th', category: 'local', source: 'Thai PBS', center: { lat: 13.7563, lon: 100.5018 }, radiusKm: 30, priority: 2, reliability: 0.9 },
    // Add: PTT/PTTOR fuel price RSS if available, BTS/MRT alerts
  ],
  province: [
    // Bangkok Metro provinces
    { url: '...', locale: 'th', category: 'local', source: 'Nonthaburi News', center: { lat: 13.8591, lon: 100.5216 }, radiusKm: 25, priority: 1, reliability: 0.7 },
    { url: '...', locale: 'th', category: 'local', source: 'Samut Prakan Daily', center: { lat: 13.5991, lon: 100.5968 }, radiusKm: 25, priority: 2, reliability: 0.7 },
  ],
  country: {
    TH: [
      { url: 'https://www.bangkokpost.com/rss/data/business.xml', locale: 'th', category: 'finance', source: 'Bangkok Post Business', center: { lat: 13.7563, lon: 100.5018 }, radiusKm: 1000, priority: 1, reliability: 0.95 },
      { url: 'https://www.bangkokpost.com/rss/data/general.xml', locale: 'th', category: 'local', source: 'Bangkok Post', center: { lat: 13.7563, lon: 100.5018 }, radiusKm: 1000, priority: 2, reliability: 0.95 },
      { url: 'https://englishnews.thaipbs.or.th/rss', locale: 'th', category: 'local', source: 'Thai PBS', center: { lat: 13.7563, lon: 100.5018 }, radiusKm: 1000, priority: 3, reliability: 0.9 },
      { url: 'https://www.pptvhd36.com/rss', locale: 'th', category: 'local', source: 'PPTV', center: { lat: 13.7563, lon: 100.5018 }, radiusKm: 1000, priority: 4, reliability: 0.8 },
      // Fuel prices — check EGAT/PTT for RSS
      { url: 'https://www.pttplc.com/rss/th/news.xml', locale: 'th', category: 'fuel', source: 'PTT News', center: { lat: 13.7563, lon: 100.5018 }, radiusKm: 1000, priority: 5, reliability: 0.85 },
    ],
    SG: [
      { url: 'https://www.straitstimes.com/news/business/rss.xml', locale: 'en', category: 'finance', source: 'Straits Times Business', center: { lat: 1.3521, lon: 103.8198 }, radiusKm: 500, priority: 1, reliability: 0.95 },
      { url: 'https://www.channelnewsasia.com/rss/feeds/business.xml', locale: 'en', category: 'finance', source: 'CNA Business', center: { lat: 1.3521, lon: 103.8198 }, radiusKm: 500, priority: 2, reliability: 0.95 },
    ],
    MY: [
      { url: 'https://www.thestar.com.my/rss/business', locale: 'en', category: 'finance', source: 'The Star Business', center: { lat: 3.1390, lon: 101.6869 }, radiusKm: 800, priority: 1, reliability: 0.9 },
      { url: 'https://www.malaymail.com/rss/business', locale: 'en', category: 'finance', source: 'Malay Mail Business', center: { lat: 3.1390, lon: 101.6869 }, radiusKm: 800, priority: 2, reliability: 0.85 },
    ],
    HK: [
      { url: 'https://www.scmp.com/rss/91/feed', locale: 'en', category: 'finance', source: 'SCMP Business', center: { lat: 22.3193, lon: 114.1694 }, radiusKm: 300, priority: 1, reliability: 0.95 },
    ],
    PH: [
      { url: 'https://business.inquirer.net/rss', locale: 'en', category: 'finance', source: 'Inquirer Business', center: { lat: 14.5995, lon: 120.9842 }, radiusKm: 1000, priority: 1, reliability: 0.9 },
      { url: 'https://www.philstar.com/rss/business', locale: 'en', category: 'finance', source: 'PhilStar Business', center: { lat: 14.5995, lon: 120.9842 }, radiusKm: 1000, priority: 2, reliability: 0.85 },
    ],
    ID: [
      { url: 'https://www.thejakartapost.com/rss/business', locale: 'en', category: 'finance', source: 'Jakarta Post Business', center: { lat: -6.2088, lon: 106.8456 }, radiusKm: 1500, priority: 1, reliability: 0.9 },
    ],
    VN: [
      { url: 'https://vnexpress.net/rss/kinh-doanh.rss', locale: 'en', category: 'finance', source: 'VnExpress Business', center: { lat: 21.0285, lon: 105.8542 }, radiusKm: 1500, priority: 1, reliability: 0.9 },
    ],
    AU: [
      { url: 'https://www.abc.net.au/news/feed/51120/rss.xml', locale: 'en', category: 'finance', source: 'ABC Business', center: { lat: -33.8688, lon: 151.2093 }, radiusKm: 2000, priority: 1, reliability: 0.95 },
      { url: 'https://www.afr.com/rss', locale: 'en', category: 'finance', source: 'Australian Financial Review', center: { lat: -33.8688, lon: 151.2093 }, radiusKm: 2000, priority: 2, reliability: 0.9 },
    ],
    US: [
      { url: 'https://feeds.bloomberg.com/markets/news.rss', locale: 'en', category: 'finance', source: 'Bloomberg Markets', center: { lat: 40.7128, lon: -74.0060 }, radiusKm: 3000, priority: 1, reliability: 0.98 },
      { url: 'https://www.marketwatch.com/rss/topstories', locale: 'en', category: 'finance', source: 'MarketWatch', center: { lat: 40.7128, lon: -74.0060 }, radiusKm: 3000, priority: 2, reliability: 0.95 },
      { url: 'https://www.wsj.com/xml/rss/3_7085.xml', locale: 'en', category: 'finance', source: 'WSJ Markets', center: { lat: 40.7128, lon: -74.0060 }, radiusKm: 3000, priority: 3, reliability: 0.95 },
    ],
    GB: [
      { url: 'https://www.ft.com/rss/home/uk', locale: 'en', category: 'finance', source: 'Financial Times UK', center: { lat: 51.5074, lon: -0.1278 }, radiusKm: 1000, priority: 1, reliability: 0.95 },
    ],
    // Add more countries as needed — each with 2-3 curated feeds
  },
  region: {
    SEA: ['TH', 'SG', 'MY', 'PH', 'ID', 'VN', 'MM', 'KH', 'LA'],
    // Map to country feeds above
  },
  global: [
    { url: 'https://feeds.bloomberg.com/markets/news.rss', locale: 'en', category: 'finance', source: 'Bloomberg Markets', center: { lat: 40.7128, lon: -74.0060 }, radiusKm: 20000, priority: 1, reliability: 0.98 },
    { url: 'https://www.reuters.com/business/finance/rss', locale: 'en', category: 'finance', source: 'Reuters Business', center: { lat: 51.5074, lon: -0.1278 }, radiusKm: 20000, priority: 2, reliability: 0.98 },
    { url: 'https://www.investing.com/rss/news_25.rss', locale: 'en', category: 'finance', source: 'Investing.com', center: { lat: 31.7683, lon: 35.2137 }, radiusKm: 20000, priority: 3, reliability: 0.85 },
  ],
};
```

### Resolver Algorithm

```typescript
// lib/news/vicinity-resolver.ts
import { VicinityFeed, TIERED_FEED_REGISTRY } from './vicinity-registry';

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function resolveVicinityFeeds(userLat: number, userLon: number, userCountry: string | null): VicinityFeed[] {
  const qualified: Array<VicinityFeed & { distanceKm: number; tier: Tier }> = [];

  // 1. City feeds (exact match by proximity)
  for (const feed of TIERED_FEED_REGISTRY.city) {
    const dist = haversineKm(userLat, userLon, feed.center.lat, feed.center.lon);
    if (dist <= feed.radiusKm) qualified.push({ ...feed, distanceKm: dist, tier: 'city' });
  }

  // 2. Province feeds
  for (const feed of TIERED_FEED_REGISTRY.province) {
    const dist = haversineKm(userLat, userLon, feed.center.lat, feed.center.lon);
    if (dist <= feed.radiusKm) qualified.push({ ...feed, distanceKm: dist, tier: 'province' });
  }

  // 3. Country feeds
  if (userCountry && TIERED_FEED_REGISTRY.country[userCountry]) {
    for (const feed of TIERED_FEED_REGISTRY.country[userCountry]) {
      const dist = haversineKm(userLat, userLon, feed.center.lat, feed.center.lon);
      if (dist <= feed.radiusKm) qualified.push({ ...feed, distanceKm: dist, tier: 'country' });
    }
  }

  // 4. Region feeds (neighboring countries)
  const region = getRegionForCountry(userCountry);
  if (region && TIERED_FEED_REGISTRY.region[region]) {
    for (const countryCode of TIERED_FEED_REGISTRY.region[region]) {
      if (countryCode === userCountry) continue; // already added
      for (const feed of TIERED_FEED_REGISTRY.country[countryCode] || []) {
        const dist = haversineKm(userLat, userLon, feed.center.lat, feed.center.lon);
        if (dist <= feed.radiusKm) qualified.push({ ...feed, distanceKm: dist, tier: 'region' });
      }
    }
  }

  // 5. Global fallback
  for (const feed of TIERED_FEED_REGISTRY.global) {
    qualified.push({ ...feed, distanceKm: 99999, tier: 'global' });
  }

  // Sort: tier order > distance > priority > reliability
  const tierOrder = { city: 0, province: 1, country: 2, region: 3, global: 4 };
  return qualified.sort((a, b) => {
    const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
    if (tierDiff !== 0) return tierDiff;
    if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.reliability - a.reliability;
  }).slice(0, 12); // Cap at 12 feeds max
}

function getRegionForCountry(country: string | null): keyof typeof TIERED_FEED_REGISTRY.region | null {
  if (!country) return null;
  const regions: Record<string, keyof typeof TIERED_FEED_REGISTRY.region> = {
    TH: 'SEA', SG: 'SEA', MY: 'SEA', PH: 'SEA', ID: 'SEA', VN: 'SEA', MM: 'SEA', KH: 'SEA', LA: 'SEA',
    US: 'NA', CA: 'NA', MX: 'NA',
    GB: 'EU', DE: 'EU', FR: 'EU', IT: 'EU', ES: 'EU', NL: 'EU',
    AU: 'OCEANIA', NZ: 'OCEANIA',
    CN: 'EAST_ASIA', JP: 'EAST_ASIA', KR: 'EAST_ASIA', TW: 'EAST_ASIA', HK: 'EAST_ASIA',
    IN: 'SOUTH_ASIA', PK: 'SOUTH_ASIA', BD: 'SOUTH_ASIA',
    BR: 'LATAM', AR: 'LATAM', CL: 'LATAM', CO: 'LATAM',
    AE: 'MENA', SA: 'MENA', QA: 'MENA', KW: 'MENA',
    ZA: 'AFRICA', NG: 'AFRICA', KE: 'AFRICA', EG: 'AFRICA',
  };
  return regions[country] || null;
}
```

---

## 2. Client Hook: `useVicinityFeeds` (`hooks/use-vicinity-feeds.ts`)

```typescript
// hooks/use-vicinity-feeds.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useResolvedLocation } from './use-resolved-location';
import { NewsItem } from '@/lib/types/budget';

interface VicinityFeedResult {
  items: NewsItem[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  refresh: () => Promise<void>;
}

const CACHE_KEY = 'bb:vicinityNewsCache';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

export function useVicinityFeeds(locale: 'th' | 'en'): VicinityFeedResult {
  const { location, country } = useResolvedLocation(); // Returns { lat, lon } | null + country code
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const fetchNews = useCallback(async () => {
    if (!location) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Build feed URLs from resolver (server-side or client-side)
      const params = new URLSearchParams({
        lat: location.lat.toString(),
        lon: location.lon.toString(),
        locale,
        country: country || '',
      });

      const res = await fetch(`/api/news/vicinity?${params.toString()}`, {
        cache: 'no-store',
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) throw new Error('Failed to fetch vicinity news');

      const data = await res.json();
      const sorted = (data.items || []).sort((a: NewsItem, b: NewsItem) => {
        if (a.actionable && !b.actionable) return -1;
        if (!a.actionable && b.actionable) return 1;
        return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
      });

      setItems(sorted.slice(0, 10));
      setLastUpdated(Date.now());
      setError(null);

      // Cache for offline/refresh
      localStorage.setItem(CACHE_KEY, JSON.stringify({ items: sorted, timestamp: Date.now(), locale }));
    } catch (err) {
      setError(locale === 'th' ? 'โหลดข่าวไม่สำเร็จ' : 'Failed to load news');
      // Try cache
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { items, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL * 2) {
          setItems(items.slice(0, 10));
        }
      }
    } finally {
      setLoading(false);
    }
  }, [location, locale, country]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return { items, loading, error, lastUpdated, refresh: fetchNews };
}
```

---

## 3. API Route: `/api/news/vicinity/route.ts`

```typescript
// app/api/news/vicinity/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { resolveVicinityFeeds } from '@/lib/news/vicinity-resolver';
import type { NewsItem } from '@/lib/types/budget';

const parser = new Parser();

async function fetchFeed(feed: VicinityFeed): Promise<NewsItem[]> {
  try {
    const parsed = await parser.parseURL(feed.url);
    return parsed.items.map(item => ({
      title: item.title || 'Untitled',
      link: item.link || '',
      pubDate: item.pubDate || new Date().toISOString(),
      source: feed.source,
      category: feed.category,
      locale: feed.locale,
      actionable: getActionableText({ title: item.title || '', category: feed.category }),
    }));
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') || '0');
  const lon = parseFloat(searchParams.get('lon') || '0');
  const locale = (searchParams.get('locale') as 'th' | 'en') || 'en';
  const country = searchParams.get('country') || null;

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Location required' }, { status: 400 });
  }

  const feeds = resolveVicinityFeeds(lat, lon, country);
  const allItems: NewsItem[] = [];

  // Fetch in parallel with timeout
  const results = await Promise.allSettled(feeds.map(f => fetchFeed(f)));
  for (const result of results) {
    if (result.status === 'fulfilled') allItems.push(...result.value);
  }

  // Dedupe by link
  const seen = new Set<string>();
  const unique = allItems.filter(item => {
    if (seen.has(item.link)) return false;
    seen.add(item.link);
    return true;
  });

  return NextResponse.json({ items: unique });
}
```

---

## 4. Animated Feed List Component (`components/dashboard/animated-feed-list.tsx`)

### Lottie/Rive Animations

| State | Animation Source | Trigger |
|-------|------------------|---------|
| **Skeleton loading** | Lottie: `animations/loading-gold-shimmer.json` | Loop on mount |
| **Empty (no location)** | Rive: `animations/empty-tuk-tuk.riv` | Auto-play + "Enable Location" CTA |
| **Empty (no items)** | Lottie: `animations/empty-coin-jar.json` | Loop |
| **Error** | Lottie: `animations/error-signal-lost.json` | Play once + retry button |
| **Pull-to-refresh** | Rive: `animations/refresh-coin-drop.riv` | Drag progress drives animation |

### Framer Motion Variants

```typescript
// components/dashboard/animated-feed-list.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useVicinityFeeds } from '@/hooks/use-vicinity-feeds';
import { Lottie } from 'lottie-react';
import { FeedCard } from './feed-card';
import { BudgetTipSkeleton } from './budget-tip-skeleton';
import loadingAnimation from '@/animations/loading-gold-shimmer.json';
import emptyLocationAnimation from '@/animations/empty-tuk-tuk.json';
import emptyNoItemsAnimation from '@/animations/empty-coin-jar.json';
import errorAnimation from '@/animations/error-signal-lost.json';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
  exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.15 } },
};

const BUDGET_TIPS_TH = [
  '💡 เติมน้ำมันวันพุธ-พฤหัส ราคามักถูกกว่า',
  '💡 ซื้อ 1 แถม 1 = ลด 50% ต่อชิ้น คุ้มกว่าลดราคา 30%',
  '💡 บัตรประจำเดือน BTS/MRT ประหยัดกว่าตั๋วเดี่ยว 30%+',
  '💡 เช็คราคาน้ำมัน PTT/Shell/Bangchak ก่อนเติมทุกครั้ง',
  '💡 ใช้ PromptPay จ่ายบิลบางแห่งมีส่วนลด 1-2%',
];

const BUDGET_TIPS_EN = [
  '💡 Fill up Wed-Thu — fuel prices often dip mid-week',
  '💡 Buy 1 Get 1 = 50% off per unit, beats 30% off',
  '💡 Monthly BTS/MRT pass saves 30%+ vs single tickets',
  '💡 Check PTT/Shell/Bangchak prices before every fill',
  '💡 Some bills give 1-2% off via PromptPay',
];

export function AnimatedFeedList({ locale }: { locale: 'th' | 'en' }) {
  const { items, loading, error, lastUpdated, refresh } = useVicinityFeeds(locale);
  const tips = locale === 'th' ? BUDGET_TIPS_TH : BUDGET_TIPS_EN;
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pull-to-refresh handler (touch + mouse wheel)
  const handleTouchStart = (e: React.TouchEvent) => { /* track startY */ };
  const handleTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - startY;
    if (delta > 0 && !isRefreshing) {
      setRefreshProgress(Math.min(delta / 100, 1));
      if (delta > 80) setIsRefreshing(true);
    }
  };
  const handleTouchEnd = async () => {
    if (isRefreshing) {
      await refresh();
      setIsRefreshing(false);
      setRefreshProgress(0);
    } else {
      setRefreshProgress(0);
    }
  };

  // Empty state: no location permission
  if (!error && loading && !lastUpdated) {
    return (
      <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
        <Lottie animationData={loadingAnimation} loop style={{ height: 120 }} />
        <BudgetTipSkeleton tips={tips} count={3} />
      </motion.div>
    );
  }

  // Empty state: location denied/unavailable
  if (!error && items.length === 0 && !loading && !lastUpdated) {
    return (
      <div className="space-y-4 text-center py-8">
        <Lottie animationData={emptyLocationAnimation} loop style={{ height: 160 }} />
        <p className="text-white/60 text-sm">{locale === 'th' ? 'อนุญาตตำแหน่งเพื่อดูข่าวใกล้ตัวคุณ' : 'Enable location for nearby news'}</p>
        <button onClick={() => navigator.permissions.request({ name: 'geolocation' })} className="bb-button-primary mt-2">
          {locale === 'th' ? 'เปิดตำแหน่ง' : 'Enable Location'}
        </button>
      </div>
    );
  }

  // Empty state: no items after fetch
  if (!error && items.length === 0 && !loading) {
    return (
      <div className="space-y-4 text-center py-8">
        <Lottie animationData={emptyNoItemsAnimation} loop style={{ height: 140 }} />
        <p className="text-white/50 text-sm">{locale === 'th' ? 'ยังไม่มีข่าวในพื้นที่นี้' : 'No local updates yet'}</p>
        <button onClick={refresh} className="bb-button-secondary text-sm">{locale === 'th' ? 'ลองใหม่' : 'Try again'}</button>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4 text-center py-8">
        <Lottie animationData={errorAnimation} loop={false} style={{ height: 120 }} />
        <p className="text-rose-400 text-sm">{error}</p>
        <p className="text-white/40 text-xs">Last updated: {lastUpdated ? formatRelative(lastUpdated) : 'Never'}</p>
        <button onClick={refresh} className="bb-button-primary">{locale === 'th' ? 'ลองอีกครั้ง' : 'Retry'}</button>
      </div>
    );
  }

  // Success: animated list
  return (
    <motion.div
      className="space-y-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.div
            key="refresh"
            layout
            className="flex justify-center py-2"
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Lottie animationData={refreshAnimation} loop style={{ height: 60, width: 60 }} />
          </motion.div>
        )}
      </AnimatePresence>

      {items.map((item, index) => (
        <motion.article key={item.link} variants={itemVariants} layout>
          <FeedCard item={item} locale={locale} index={index} />
        </motion.article>
      ))}

      {lastUpdated && (
        <p className="text-center text-white/30 text-xs mt-4">
          {locale === 'th' ? 'อัปเดต' : 'Updated'} {formatRelative(lastUpdated)}
        </p>
      )}
    </motion.div>
  );
}
```

---

## 5. Feed Card Component (`components/dashboard/feed-card.tsx`)

```typescript
// components/dashboard/feed-card.tsx
'use client';

import { motion } from 'framer-motion';
import { ExternalLink, Fuel, TrendingUp, Zap, ShoppingBag, AlertCircle } from 'lucide-react';
import { NewsItem } from '@/lib/types/budget';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

const CATEGORY_ICONS = {
  finance: <TrendingUp className="w-5 h-5 text-amber-400" />,
  economy: <Zap className="w-5 h-5 text-blue-400" />,
  local: <AlertCircle className="w-5 h-5 text-emerald-400" />,
  eco_tips: <Zap className="w-5 h-5 text-emerald-400" />,
  fuel: <Fuel className="w-5 h-5 text-rose-400" />,
  deals: <ShoppingBag className="w-5 h-5 text-amber-400" />,
};

const CATEGORY_LABELS: Record<NewsItem['category'], { th: string; en: string }> = {
  finance: { th: 'การเงิน', en: 'Finance' },
  economy: { th: 'เศรษฐกิจ', en: 'Economy' },
  local: { th: 'ท้องถิ่น', en: 'Local' },
  eco_tips: { th: 'เคล็ดลับ', en: 'Tips' },
  fuel: { th: 'น้ำมัน', en: 'Fuel' },
  deals: { th: 'โปรโมชั่น', en: 'Deals' },
};

interface FeedCardProps {
  item: NewsItem;
  locale: 'th' | 'en';
  index: number;
}

export function FeedCard({ item, locale, index }: FeedCardProps) {
  const isActionable = !!item.actionable;

  return (
    <motion.article
      className="group p-4 rounded-xl bg-black/30 border border-white/10 hover:border-white/20 transition-colors relative overflow-hidden"
      whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(245, 215, 66, 0.08)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{ transitionDelay: index * 0.05 }}
    >
      {/* Gold shimmer sweep on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--gold-glow)]/10 to-transparent"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />

      <div className="flex items-start gap-3 relative z-10">
        <div className="flex-shrink-0 mt-0.5">
          {CATEGORY_ICONS[item.category]}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-medium text-amber-400 uppercase">
              {CATEGORY_LABELS[item.category][locale]}
            </span>
            <span className="text-xs text-white/40">
              {format(new Date(item.pubDate), locale === 'th' ? 'd MMM yyyy' : 'MMM d, yyyy', { locale: locale === 'th' ? th : undefined })}
            </span>
          </div>

          <h4 className="font-medium text-white text-sm line-clamp-2 group-hover:text-amber-400 transition-colors">
            {item.title}
          </h4>

          {isActionable && (
            <motion.p
              className="mt-2 text-sm text-amber-400 font-medium flex items-center gap-1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
            >
              <span>💡</span>
              {item.actionable}
            </motion.p>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
            <span className="text-xs text-white/50">{item.source}</span>
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              {locale === 'th' ? 'อ่านต่อ' : 'Read more'}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
```

---

## 6. Budget Tip Skeleton (`components/dashboard/budget-tip-skeleton.tsx`)

```typescript
// components/dashboard/budget-tip-skeleton.tsx
'use client';

import { motion } from 'framer-motion';
import { Lottie } from 'lottie-react';
import loadingAnimation from '@/animations/loading-gold-shimmer.json';

interface BudgetTipSkeletonProps {
  tips: string[];
  count: number;
}

export function BudgetTipSkeleton({ tips, count }: BudgetTipSkeletonProps) {
  const [tipIndex, setTipIndex] = useState(0);

  // Rotate tip every 3 seconds
  useEffect(() => {
    const id = setInterval(() => setTipIndex(i => (i + 1) % tips.length), 3000);
    return () => clearInterval(id);
  }, [tips.length]);

  return (
    <div className="space-y-3" role="status" aria-label="Loading news with budget tips">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className="h-24 rounded-xl bg-white/5 overflow-hidden relative"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          {/* Gold shimmer sweep */}
          <Lottie animationData={loadingAnimation} loop style={{ width: '100%', height: '100%' }} />

          {/* Budget tip overlay */}
          <div className="absolute inset-0 flex items-center justify-center px-4 pointer-events-none">
            <motion.span
              className="text-white/70 text-sm text-center font-medium bg-black/60 px-3 py-1.5 rounded-lg"
              key={tipIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              {tips[tipIndex]}
            </motion.span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
```

---

## 7. Animation Assets Required

| File | Format | Spec |
|------|--------|------|
| `public/animations/loading-gold-shimmer.json` | Lottie | 2s loop, gold sweep left→right, obsidian bg |
| `public/animations/empty-tuk-tuk.json` | Lottie | 3s loop, tuk-tuk idles, "Enable Location" speech bubble |
| `public/animations/empty-coin-jar.json` | Lottie | 4s loop, coins drop into jar, jar fills then resets |
| `public/animations/error-signal-lost.json` | Lottie | 2s once, signal bars drop, "📡" shakes |
| `public/animations/refresh-coin-drop.riv` | Rive | State machine: idle → pull (coin rises) → release (coin drops + bounce) → refresh spin |

**Commission specs**:
- **Style**: Obsidian Gold palette (`#080600` bg, `#C9960C` gold, `#F5D742` glow)
- **Dimensions**: 200×200px square, transparent bg
- **Delivery**: `.json` (Lottie) + `.riv` (Rive) for each

---

## 8. Updated `AlertsSidebar` Integration

```typescript
// components/dashboard/alerts-sidebar.tsx (simplified)
'use client';

import { AnimatedFeedList } from './animated-feed-list';

export function AlertsSidebar({ locale, isModal = false }: { locale: 'th' | 'en'; isModal?: boolean }) {
  if (isModal) {
    return (
      <div className="h-full flex flex-col">
        <AnimatedFeedList locale={locale} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white text-lg">
          {locale === 'th' ? 'ข่าวและข้อมูลล่าสุด' : 'Latest Updates'}
        </h3>
      </div>
      <AnimatedFeedList locale={locale} />
    </div>
  );
}
```

---

## 9. Testing Strategy

| Test | Tool | Coverage |
|------|------|----------|
| `vicinity-resolver.ts` distance sort | Vitest | 100% — tier order, distance, priority, reliability |
| `useVicinityFeeds` hook | React Testing Library | Mock geolocation, cache, error, refresh |
| `/api/news/vicinity` route | Vitest + MSW | Mock RSS parser, verify feed selection |
| `AnimatedFeedList` | Playwright | Visual regression: loading, empty, error, success states |
| `FeedCard` animations | Playwright | Hover shimmer, actionable pulse, entrance stagger |
| Lottie/Rive load | Playwright | Animations render, no console errors |

---

## 10. Rollout Phases

| Phase | Deliverable | Est. Effort |
|-------|-------------|-------------|
| **1. Resolver + Feeds** | `vicinity-resolver.ts`, `vicinity-registry.ts`, API route, hook | 2-3 days |
| **2. Animated List + Cards** | `AnimatedFeedList`, `FeedCard`, `BudgetTipSkeleton` | 2 days |
| **3. Lottie/Rive Assets** | Commission 5 animations, integrate | 1-2 days (external) |
| **4. Polish & Edge Cases** | Pull-to-refresh, offline cache, a11y, perf | 1-2 days |

---

## 11. Success Criteria

- ✅ User in Bangkok sees BKK feeds first, then TH national, then SEA, then global
- ✅ User in Singapore sees SG feeds → SEA region → global
- ✅ Skeleton shows rotating Thai/English budget tips with gold shimmer
- ✅ Empty state shows tuk-tuk animation + location CTA
- ✅ Pull-to-refresh triggers coin-drop Rive animation
- ✅ Cards stagger in with spring physics, hover shimmer sweep
- ✅ Actionable badges pulse in on mount
- ✅ All animations < 16ms frame budget on 5-year-old Android
- ✅ 0 console errors, 100% a11y (axe-core)

---

## 12. Out of Scope (Future)

- Push notifications for fuel price drops
- User-customizable feed categories
- Offline-first IndexedDB sync (beyond 6h cache)
- Provincial feeds for non-TH countries
- Admin feed health dashboard