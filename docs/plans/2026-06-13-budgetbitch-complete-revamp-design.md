# BudgetBITCH Complete Revamp — Design Document

**Date:** 2026-06-13
**Status:** DRAFT — awaiting approval
**Branch:** `revamp/complete-rewrite`

---

## 1. Vision & Scope

**Goal:** Replace the current over-engineered BudgetBITCH with a **lean, local-first budget app** that:
- Starts with **language selection (Thai/English)** → **voice-guided 10-question onboarding wizard**
- Stores **all budget data locally** (IndexedDB + localStorage)
- Uses **Convex only for Auth + daily snapshots**
- Has a **feature-complete Dashboard** with mainstream budget tools
- Includes a **Critical Expenses** flow to cut one unpractical expense/month with compound savings calculator
- Shows **localized RSS news/eco tips** with one-time privacy disclaimer
- Removes **all paid APIs, Prisma/Neon, Inngest, Resend, Sentry**
- **PWA-first, offline-capable, Thai-context aware**

**Non-goals:** Banking integrations, investment tracking, multi-user workspaces, AI advisors, paid APIs.

---

## 2. Tech Stack (Simplified)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 16 (App Router) + React 19 | Already in place |
| Styling | Tailwind CSS 4 | Already in place |
| Auth | **Convex Auth** (email/password) | Keep existing, zero cost |
| Primary DB | **IndexedDB (idb) + localStorage** | All budget data local, works offline |
| Sync/Backup | **Convex** — daily snapshot of user profile + wizard answers | Free tier, realtime if needed |
| Charts | **Recharts** (already installed) | Lightweight, tree-shakeable |
| RSS Parsing | **rss-parser** (npm) | Client-side, no API key |
| Location | **Browser Geolocation API** | Native, free |
| PWA | **next-pwa** (add) | Installable, offline-first |
| i18n | **next-intl** (already installed) | Thai/English, locale-aware formatting |
| Voice | **Web Speech API** (STT/TTS) | Zero cost, browser-native |
| Cache | **Local `.cache/` folder** (gitignored) | Token savings for agents |

**Removed:** Prisma, Neon, Inngest, Resend, Sentry, @vercel/analytics, cloudflare, neon, pg, @prism/adapter-pg, @auth/core (except Convex auth), @react-email/*.

---

## 3. User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. LANDING (/)
│    ├─ Language Select Modal (Thai 🇹🇭 / English 🇺🇸) — FIRST THING
│    │   → saved to localStorage 'preferredLocale'
│    ├─ Not signed in → WelcomeWindow → Sign in/up (Convex)
│    └─ Signed in → Check localStorage for wizard completion
│
├─────────────────────────────────────────────────────────────────┤
│ 2. 10-QUESTION VOICE WIZARD (/wizard) — replaces LaunchWizard
│    Step 0: Language already set ✓
│    Q1: Monthly income (number, THB/USD) — voice: "How much you make a month?"
│    Q2: Rent/Mortgage (number) — voice: "Rent or mortgage?"
│    Q3: Transport cost (number) — voice: "Grab, BTS, fuel — what's transport?"
│    Q4: Phone/Internet (number) — voice: "Phone and internet bill?"
│    Q5: Subscriptions (number) — voice: "Netflix, Spotify, gym — subscriptions?"
│    Q6: Entertainment (number) — voice: "Fun money — movies, games, going out?"
│    Q7: Healthcare (number) — voice: "Meds, dentist, checkups?"
│    Q8: Savings rate % (slider 0-50%) — voice: "What % you wanna save?"
│    Q9: Risk tolerance (low/med/high) — voice: "Play it safe or take risks?"
│    Q10: Location consent (grant/deny) + privacy disclaimer
│         "We use location ONLY for local prices, fuel alerts, 7-Eleven deals.
│          No marketing. No tracking. Ever."
│    → Save to localStorage + IndexedDB
│    → Push snapshot to Convex (daily)
│
├─────────────────────────────────────────────────────────────────┤
│ 3. DASHBOARD (/dashboard) — Single "Money Pulse" screen
│    ├─ Top Bar: Globe 🌐 + Wrench 🔧 (settings) — persistent
│    ├─ Hero: **ONE NUMBER** — "Daily disposable: ฿XXX / $XX"
│    │   (income - fixed expenses - savings target) / days in month
│    ├─ Critical Expenses Button (pulse animation) → Modal
│    │   8 unpractical items with THAI CONTEXT:
│    │   1. Sugar & sweets (กาแฟหวาน, ขนม)
│    │   2. Daily coffee (คาเฟ่ทุกวัน)
│    │   3. Takeaways/GrabFood (สั่งอาหาร)
│    │   4. Alcohol (เบียร์, เหล้า)
│    │   5. Cigarettes/Vaping (บุหรี่/วูป)
│    │   6. Streaming (Netflix, Disney+, TrueID)
│    │   7. Ride-hailing (Grab, Bolt)
│    │   8. Impulse shopping (Lazada, Shopee, TikTok Shop)
│    │   User picks ONE → shows **compound savings calculator**:
│    │   "Cut GrabFood (฿3,000/mo) → Invest at 7% = ฿44,000 in 1 year"
│    ├─ Expandable Panels (accordion, not tabs):
│    │   ├─ Expenses: Category tracking + monthly budgets
│    │   ├─ Budget Visual: Income vs Expense (bar chart)
│    │   ├─ Bills: Due-soon + calendar (Thai holidays highlighted)
│    │   ├─ Goals: Savings goals (progress rings)
│    │   ├─ Net Worth: Assets - Liabilities
│    │   ├─ Subscriptions: Detected recurring (TrueWallet, GrabPay)
│    │   ├─ Emergency Fund: Target + progress
│    │   ├─ Debt Payoff: Avalanche/Snowball
│    │   └─ Forecast: 30/60/90 day cash flow
│    └─ Sidebar: Actionable local alerts (not passive news)
│         • "Fuel drops tomorrow — fill up today"
│         • "7-Eleven 1+1 coffee Thursday"
│         • "BTS monthly pass saves ฿X vs daily"
│         • RSS from: Bangkok Post, Thai PBS, Reuters TH, local price feeds
│
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Data Models (TypeScript)

```typescript
// lib/types/budget.ts

/** Wizard answers — stored locally, snapshotted to Convex daily */
export interface WizardProfile {
  completed: true;
  completedAt: string; // ISO
  version: 1;
  locale: 'th' | 'en'; // SET FIRST, NEVER CHANGES WITHOUT USER ACTION
  answers: {
    income: number;           // Q1
    rent: number;             // Q2
    transport: number;        // Q3
    phoneInternet: number;    // Q4
    subscriptions: number;    // Q5
    entertainment: number;    // Q6
    healthcare: number;       // Q7
    savingsRatePct: number;   // Q8 (0-50)
    riskTolerance: 'low' | 'medium' | 'high'; // Q9
    locationConsent: boolean; // Q10
    currency: 'THB' | 'USD'; // derived from locale
  };
}

/** Critical expense commitment — one per month */
export interface CriticalExpenseCommitment {
  month: string; // '2026-06'
  expenseKey: CriticalExpenseKey;
  estimatedMonthlyCost: number; // user enters this
  committedAt: string;
  status: 'active' | 'completed' | 'failed';
  compoundProjection: { // auto-calculated
    oneYear: number;
    fiveYears: number;
    tenYears: number;
  };
}

export type CriticalExpenseKey =
  | 'sugar'
  | 'coffee'
  | 'takeaways'
  | 'alcohol'
  | 'cigarettes_vaping'
  | 'streaming'
  | 'ride_hailing'
  | 'impulse_shopping';

export const CRITICAL_EXPENSES: Record<CriticalExpenseKey, { 
  labelTh: string; 
  labelEn: string; 
  icon: string;
  thaiContext: string;
}> = {
  sugar: { 
    labelTh: 'น้ำตาลและขนมหวาน', 
    labelEn: 'Sugar & sweets', 
    icon: '🍬',
    thaiContext: 'ชาเย็น, กาแฟหวาน, เค้ก, ขนมไทย'
  },
  coffee: { 
    labelTh: 'คาเฟ่ทุกวัน', 
    labelEn: 'Daily coffee', 
    icon: '☕',
    thaiContext: 'สตาร์บัคส์, แอมازอน, คาเฟ่ห้องทำงาน'
  },
  takeaways: { 
    labelTh: 'สั่งอาหาร (GrabFood/Foodpanda)', 
    labelEn: 'Takeaways/delivery', 
    icon: '🍕',
    thaiContext: 'สั่งกลับบ้าน/ทำงาน แทนทำกินเอง'
  },
  alcohol: { 
    labelTh: 'แอลกอฮอล์', 
    labelEn: 'Alcohol', 
    icon: '🍺',
    thaiContext: 'เบียร์, เหล้าขาว, ดื่มกับเพื่อน'
  },
  cigarettes_vaping: { 
    labelTh: 'บุหรี่/วูป', 
    labelEn: 'Cigarettes/Vaping', 
    icon: '🚬',
    thaiContext: 'บุหรี่ม้วน, วูป, IQOS'
  },
  streaming: { 
    labelTh: 'สตรีมมิง (Netflix/Disney+/TrueID)', 
    labelEn: 'Streaming subscriptions', 
    icon: '📺',
    thaiContext: 'Netflix, Disney+, HBO GO, TrueID, Viu'
  },
  ride_hailing: { 
    labelTh: 'กรับ/โบลท์', 
    labelEn: 'Ride-hailing (Grab/Bolt)', 
    icon: '🚗',
    thaiContext: 'GrabCar, GrabBike, Bolt, รถเมล์/BTS ที่นั่งสบาย'
  },
  impulse_shopping: { 
    labelTh: 'ช็อปปิ้งอימפัลส์ (Lazada/Shopee/TikTok Shop)', 
    labelEn: 'Impulse online shopping', 
    icon: '🛍️',
    thaiContext: 'Flash sale, ไลฟ์สดขายของ, ซื้อไม่ได้ลอง'
  },
};

/** Expense entry — local only */
export interface ExpenseEntry {
  id: string; // uuid
  date: string; // ISO date
  category: ExpenseCategory;
  merchant: string;
  amount: number; // positive
  note?: string;
  isRecurring?: boolean;
  recurringId?: string; // for subscription detection
  source: 'manual' | 'voice' | 'import';
}

export type ExpenseCategory =
  | 'housing' | 'transport' | 'food' | 'utilities'
  | 'phone_internet' | 'subscriptions' | 'entertainment'
  | 'healthcare' | 'insurance' | 'debt' | 'savings' | 'other';

/** Thai-specific category aliases for voice/input */
export const THAI_CATEGORY_ALIASES: Record<string, ExpenseCategory> = {
  'ค่าเช่า': 'housing', 'ค่าคอนโด': 'housing', 'บ้าน': 'housing',
  'ค่าเดินทาง': 'transport', 'บีทีเอส': 'transport', 'รถไฟฟ้า': 'transport', 'กรับ': 'transport', 'น้ำมัน': 'transport',
  'ค่าอาหาร': 'food', 'กินข้าว': 'food', 'เซปอะ': 'food', '7-11': 'food',
  'ค่าน้ำค่าไฟ': 'utilities', 'อินเตอร์เน็ต': 'phone_internet', 'โทรศัพท์': 'phone_internet',
  'สมัครสมาชิก': 'subscriptions', 'เน็ตฟลิกซ์': 'subscriptions', 'สปอตตี้': 'subscriptions',
  'บันเทิง': 'entertainment', 'ดูหนัง': 'entertainment', 'เล่นเกม': 'entertainment',
  'ค่ายา': 'healthcare', 'ทันตกรรม': 'healthcare', 'โรงพยาบาล': 'healthcare',
  'ประกัน': 'insurance', 'หนี้': 'debt', 'เงินกู้': 'debt', 'บัตรเครดิต': 'debt',
  'ออม': 'savings', 'กองทุน': 'savings',
};

/** Budget category with limit */
export interface BudgetCategory {
  category: ExpenseCategory;
  monthlyLimit: number;
  alertAtPct: number; // e.g., 80
}

/** Bill reminder */
export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDay: number; // 1-31
  category: ExpenseCategory;
  isActive: boolean;
  reminderDaysBefore: number; // default 3
}

/** Savings goal */
export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string; // ISO
  category: 'emergency' | 'vacation' | 'purchase' | 'investment' | 'other';
  autoAllocate?: number; // monthly auto-transfer
}

/** Net worth snapshot */
export interface NetWorthSnapshot {
  date: string; // ISO
  assets: { id: string; name: string; value: number; type: 'cash' | 'investment' | 'property' | 'vehicle' | 'gold' | 'crypto' | 'other' }[];
  liabilities: { id: string; name: string; value: number; type: 'credit_card' | 'personal_loan' | 'car_loan' | 'mortgage' | 'family' | 'other' }[];
  netWorth: number;
}

/** Debt for payoff planner */
export interface Debt {
  id: string;
  name: string;
  balance: number;
  apr: number; // annual percentage rate
  minimumPayment: number;
  type: 'credit_card' | 'personal_loan' | 'car_loan' | 'mortgage' | 'family' | 'other';
}

/** RSS news item */
export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  category: 'finance' | 'economy' | 'local' | 'eco_tips' | 'fuel' | 'deals';
  locale: 'th' | 'en';
  actionable?: string; // e.g., "Fill up today - price drops tomorrow"
}

/** Location cache */
export interface LocationCache {
  lat: number;
  lon: number;
  city: string;
  province: string;
  country: 'TH' | 'US' | 'OTHER';
  timestamp: number;
  timezone: string;
}
```

---

## 5. Storage Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    LOCAL FIRST (IndexedDB)                  │
├────────────────────────────────────────────────────────────┤
│  DB: 'budgetbitch'  (idb wrapper, versioned migrations)    │
│  Stores:                                                    │
│   - wizardProfile (single record, key: 'current')          │
│   - expenses[] (unlimited, indexed by date, category)      │
│   - budgets[] (by category)                                │
│   - bills[]                                                │
│   - savingsGoals[]                                         │
│   - netWorthSnapshots[] (monthly, auto-generated)          │
│   - debts[]                                                │
│   - criticalExpenseCommitments[] (by month)                │
│   - newsCache[] (RSS items, TTL 6h, indexed by locale+category) │
│   - locationCache { lat, lon, city, province, country, timestamp } │
│   - privacyDisclaimerAccepted: boolean                     │
│   - preferredLocale: 'th' | 'en' (set once, globe🌐 in header) │
│   - voiceSettings: { enabled: boolean, rate: number, pitch: number } │
└────────────────────────────────────────────────────────────┘
                              │
                              ▼ daily (background, via SW)
┌────────────────────────────────────────────────────────────┐
│                    CONVEX (Auth + Snapshots)                │
├────────────────────────────────────────────────────────────┤
│  Tables:                                                    │
│   - users (Convex Auth managed)                            │
│   - dailySnapshots { userId, date, wizardProfile,          │
│       totals: { income, expenses, savings, netWorth },     │
│       criticalExpenseCommitment, createdAt }               │
│   - authSessions (Convex Auth)                             │
└────────────────────────────────────────────────────────────┘
```

---

## 6. Convex Schema (Minimal)

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  dailySnapshots: defineTable({
    userId: v.string(),           // Convex auth user ID
    date: v.string(),             // YYYY-MM-DD
    wizardProfile: v.any(),       // Full wizard profile JSON
    totals: v.object({
      income: v.number(),
      expenses: v.number(),
      savings: v.number(),
      netWorth: v.optional(v.number()),
    }),
    criticalExpenseCommitment: v.optional(v.object({
      expenseKey: v.string(),
      estimatedMonthlyCost: v.number(),
      status: v.string(),
      compoundProjection: v.object({
        oneYear: v.number(),
        fiveYears: v.number(),
        tenYears: v.number(),
      }),
    })),
    createdAt: v.number(),
  }).index("by_user_and_date", ["userId", "date"]),
});
```

---

## 7. Key Components (New/Modified)

| Component | Path | Status |
|-----------|------|--------|
| Language Select Modal | `src/components/onboarding/language-select-modal.tsx` | **NEW** — First screen |
| Wizard Shell | `src/components/wizard/wizard-shell.tsx` | **NEW** — 10-step, voice-guided |
| Wizard Steps | `src/components/wizard/steps/` | **NEW** — 10 files + voice helpers |
| Voice Hook | `src/hooks/use-voice.ts` | **NEW** — Web Speech API wrapper |
| Dashboard Shell | `src/components/dashboard/dashboard-shell.tsx` | **REPLACE** MoneyDashboard |
| Daily Disposable Hero | `src/components/dashboard/daily-disposable-hero.tsx` | **NEW** — One big number |
| Critical Expenses Modal | `src/components/dashboard/critical-expenses-modal.tsx` | **NEW** — With compound calc |
| Expandable Panels (9) | `src/components/dashboard/panels/` | **NEW** — Accordion style |
| News/Alerts Sidebar | `src/components/dashboard/alerts-sidebar.tsx` | **NEW** — Actionable, not passive |
| Globe + Wrench Header | `src/components/layout/header-bar.tsx` | **NEW** — Persistent top bar |
| Local DB (idb) | `src/lib/db/local-db.ts` | **NEW** — CRUD + migrations |
| Convex Sync | `src/lib/convex/sync-snapshots.ts` | **NEW** — Daily push via SW |
| RSS Fetcher | `src/lib/news/rss-fetcher.ts` | **NEW** — Thai + EN sources |
| Location Helper | `src/lib/location/get-location.ts` | **NEW** — Geolocation + reverse geocode |
| Thai Category Mapper | `src/lib/utils/thai-category-mapper.ts` | **NEW** — Voice → category |
| Compound Calculator | `src/lib/utils/compound-calculator.ts` | **NEW** — Critical expense projections |
| Dev Tree Diagram | `docs/dev-tree-diagram.md` | **NEW** |
| PWA Config | `next-pwa` config + manifest | **ADD** |

---

## 8. Pages / Routes

| Route | Component | Auth |
|-------|-----------|------|
| `/` | Landing → Language Select → Auth check | Optional |
| `/sign-in` | Convex Auth (styled) | Public |
| `/sign-up` | Convex Auth (styled) | Public |
| `/wizard` | WizardShell (voice-guided) | **Required** |
| `/dashboard` | DashboardShell (Money Pulse) | **Required** |
| `/settings` | Settings (locale, voice, data export, reset) | Required |

---

## 9. Dev Tree Diagram (for agents)

```
BudgetBITCH/
├── .cache/                              # gitignored — agent token cache
├── convex/
│   ├── schema.ts                        # Minimal: auth + dailySnapshots
│   ├── auth.config.ts                   # Convex Auth config
│   └── snapshots.ts                     # Mutation: upsert daily snapshot
├── src/
│   ├── app/
│   │   ├── layout.tsx                   # Providers: ConvexAuth, next-intl, PWA, Voice
│   │   ├── page.tsx                     # Landing → LanguageSelect → redirect
│   │   ├── sign-in/[[...page]].tsx      # Convex Auth UI
│   │   ├── sign-up/[[...page]].tsx      # Convex Auth UI
│   │   ├── wizard/page.tsx              # WizardShell (protected)
│   │   ├── dashboard/page.tsx           # DashboardShell (protected)
│   │   └── settings/page.tsx            # Settings (protected)
│   ├── components/
│   │   ├── onboarding/
│   │   │   └── language-select-modal.tsx
│   │   ├── wizard/
│   │   │   ├── wizard-shell.tsx
│   │   │   ├── wizard-progress.tsx
│   │   │   ├── voice-toggle.tsx
│   │   │   └── steps/
│   │   │       ├── step-income.tsx
│   │   │       ├── step-rent.tsx
│   │   │       ├── step-transport.tsx
│   │   │       ├── step-phone-internet.tsx
│   │   │       ├── step-subscriptions.tsx
│   │   │       ├── step-entertainment.tsx
│   │   │       ├── step-healthcare.tsx
│   │   │       ├── step-savings-rate.tsx
│   │   │       ├── step-risk-tolerance.tsx
│   │   │       └── step-location-consent.tsx
│   │   ├── dashboard/
│   │   │   ├── dashboard-shell.tsx
│   │   │   ├── daily-disposable-hero.tsx
│   │   │   ├── critical-expenses-modal.tsx
│   │   │   ├── alerts-sidebar.tsx
│   │   │   ├── compound-savings-calculator.tsx
│   │   │   └── panels/
│   │   │       ├── expense-tracker.tsx
│   │   │       ├── budget-visual.tsx
│   │   │       ├── bills.tsx
│   │   │       ├── savings-goals.tsx
│   │   │       ├── net-worth.tsx
│   │   │       ├── subscriptions.tsx
│   │   │       ├── emergency-fund.tsx
│   │   │       ├── debt-payoff.tsx
│   │   │       └── cash-flow-forecast.tsx
│   │   ├── layout/
│   │   │   └── header-bar.tsx           # Globe🌐 + Wrench🔧
│   │   ├── auth/                        # Convex Auth UI (minimal)
│   │   └── ui/                          # Shared: Button, Card, Modal, Chart, Accordion
│   ├── hooks/
│   │   ├── use-voice.ts                 # Web Speech API (STT/TTS)
│   │   ├── use-local-db.ts              # IndexedDB reactor
│   │   └── use-daily-snapshot.ts        # Convex sync trigger
│   ├── lib/
│   │   ├── db/
│   │   │   └── local-db.ts              # idb wrapper: CRUD + migrations
│   │   ├── convex/
│   │   │   └── sync-snapshots.ts        # Daily push to Convex
│   │   ├── news/
│   │   │   └── rss-fetcher.ts           # RSS parsing + caching (TH/EN)
│   │   ├── location/
│   │   │   └── get-location.ts          # Geolocation + reverse geocode
│   │   ├── utils/
│   │   │   ├── thai-category-mapper.ts  # Voice Thai → category
│   │   │   ├── compound-calculator.ts   # Critical expense projections
│   │   │   ├── currency.ts              # THB/USD formatting
│   │   │   ├── date.ts                  # Thai calendar, holidays
│   │   │   └── uuid.ts
│   │   └── types/
│   │       └── budget.ts
│   └── modules/                         # REMOVE — fold into lib/components
├── docs/
│   ├── plans/
│   │   └── 2026-06-13-budgetbitch-complete-revamp-design.md
│   └── dev-tree-diagram.md
├── public/
│   ├── manifest.json                    # PWA manifest
│   └── sw.js                            # Service worker (workbox)
├── package.json                         # Pruned deps + next-pwa, rss-parser
├── .gitignore                           # + .cache/
├── next.config.ts                       # + next-pwa, i18n
└── README.md
```

---

## 10. Migration Strategy

1. **Create new branch** `revamp/complete-rewrite`
2. **Prune package.json** — remove Prisma, Neon, Inngest, Resend, Sentry, cloudflare, neon, pg, @prisma/*, @auth/core, @react-email/*, @vercel/analytics
3. **Add deps**: `next-pwa`, `rss-parser`, `idb` (if not in convex deps), `date-fns-th` (Thai dates)
4. **Write Convex schema + auth** (minimal)
5. **Build local-db.ts** (idb wrapper with migrations, version 1)
6. **Build Language Select Modal** (first screen, sets locale forever)
7. **Build 10-step Wizard** with voice (replace LaunchWizard)
8. **Build DashboardShell** with Daily Disposable Hero + 9 accordion panels
9. **Build Critical Expenses Modal** with compound calculator
10. **Build Alerts Sidebar** (RSS Thai/EN, actionable, cached 6h)
11. **Build Globe🌐 + Wrench🔧 HeaderBar** (persistent, settings modal)
12. **Add PWA** (next-pwa, manifest, SW, offline fallback)
13. **Write dev-tree-diagram.md**
14. **Add .cache/ to .gitignore**
15. **All tests pass**: `npm run lint`, `npm test`, `npm run build`
16. **Merge to main** via PR

---

## 11. RSS Sources (Free, No API Key)

| Locale | Source | Feed URL | Category |
|--------|--------|----------|----------|
| TH | Bangkok Post Business | `https://www.bangkokpost.com/rss/data/business.xml` | finance |
| TH | Bangkok Post General | `https://www.bangkokpost.com/rss/data/general.xml` | local |
| TH | Thai PBS | `https://englishnews.thaipbs.or.th/rss` | local |
| TH | PPTV | `https://www.pptvhd36.com/rss` | local |
| TH | Fuel Price (Bangchak/PTT) | Custom scrape → local cache | fuel |
| EN | Reuters Business | `https://www.reuters.com/business/finance/rss` | finance |
| EN | Reuters World | `https://www.reuters.com/world/rss` | economy |
| EN | BangPost EN | `https://www.bangkokpost.com/rss/data/business.xml` | finance |

**Cached 6h in IndexedDB. Filtered for actionable keywords: fuel, price, discount, 1+1, promo, BTS, MRT, electricity, water.**

---

## 12. Decisions (Approved)

| # | Question | Decision |
|---|----------|----------|
| 1 | Voice default | **OFF** — user toggles in wizard + settings |
| 2 | Wizard UX | **Mobile-first** — one question per screen |
| 3 | Critical Expense cost | **Suggest from wizard answers** — manual override from dashboard |
| 4 | Thai holidays | **Practical choice** — `date-fns-th` for Buddhist calendar + gov holidays in Bills panel |
| 5 | Data export | **Skip** — not needed |
| 6 | Theme | **Keep amber/dark + Thai temple gold accent** |
| 7 | PWA install prompt | **PRE-WIZARD** — after language select, before wizard |

---

## 13. Approval

- [ ] Design approved — proceed to **Phase 2: Writing Plans**
- [ ] Changes requested — see comments