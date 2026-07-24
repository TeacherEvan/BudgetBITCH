import type { NewsItem } from '@/lib/types/budget';

export interface VicinityFeed {
  url: string;
  locale: 'th' | 'en';
  category: NewsItem['category'];
  source: string;
  center: { lat: number; lon: number };
  radiusKm: number;
  priority: number;
  reliability: number;
}

export type Tier = 'city' | 'province' | 'country' | 'region' | 'global';

export interface VicinityFeedWithMeta extends VicinityFeed {
  distanceKm: number;
  tier: Tier;
}

interface RegionMap {
  SEA: string[];
  NA: string[];
  EU: string[];
  OCEANIA: string[];
  EAST_ASIA: string[];
  SOUTH_ASIA: string[];
  LATAM: string[];
  MENA: string[];
  AFRICA: string[];
}

export const TIERED_FEED_REGISTRY: {
  city: VicinityFeed[];
  province: VicinityFeed[];
  country: Record<string, VicinityFeed[]>;
  region: RegionMap;
  global: VicinityFeed[];
} = {
  city: [
    // Bangkok example
    { url: 'https://www.bangkokpost.com/rss/data/business.xml', locale: 'th', category: 'finance', source: 'Bangkok Post Business', center: { lat: 13.7563, lon: 100.5018 }, radiusKm: 30, priority: 1, reliability: 0.95 },
    { url: 'https://englishnews.thaipbs.or.th/rss', locale: 'th', category: 'local', source: 'Thai PBS', center: { lat: 13.7563, lon: 100.5018 }, radiusKm: 30, priority: 2, reliability: 0.9 },
    // Add: PTT/PTTOR fuel price RSS if available, BTS/MRT alerts
  ],
  province: [
    // Bangkok Metro provinces
    { url: '', locale: 'th', category: 'local', source: 'Nonthaburi News', center: { lat: 13.8591, lon: 100.5216 }, radiusKm: 25, priority: 1, reliability: 0.7 },
    { url: '', locale: 'th', category: 'local', source: 'Samut Prakan Daily', center: { lat: 13.5991, lon: 100.5968 }, radiusKm: 25, priority: 2, reliability: 0.7 },
  ],
  country: {
    TH: [
      { url: 'https://www.bangkokpost.com/rss/data/business.xml', locale: 'th', category: 'finance', source: 'Bangkok Post Business', center: { lat: 13.7563, lon: 100.5018 }, radiusKm: 1000, priority: 1, reliability: 0.95 },
      { url: 'https://www.bangkokpost.com/rss/data/general.xml', locale: 'th', category: 'local', source: 'Bangkok Post', center: { lat: 13.7563, lon: 100.5018 }, radiusKm: 1000, priority: 2, reliability: 0.95 },
      { url: 'https://englishnews.thaipbs.or.th/rss', locale: 'th', category: 'local', source: 'Thai PBS', center: { lat: 13.7563, lon: 100.5018 }, radiusKm: 1000, priority: 3, reliability: 0.9 },
      { url: 'https://www.pptvhd36.com/rss', locale: 'th', category: 'local', source: 'PPTV', center: { lat: 13.7563, lon: 100.5018 }, radiusKm: 1000, priority: 4, reliability: 0.8 },
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
    NA: ['US', 'CA', 'MX'],
    EU: ['GB', 'DE', 'FR', 'IT', 'ES', 'NL'],
    OCEANIA: ['AU', 'NZ'],
    EAST_ASIA: ['CN', 'JP', 'KR', 'TW', 'HK'],
    SOUTH_ASIA: ['IN', 'PK', 'BD'],
    LATAM: ['BR', 'AR', 'CL', 'CO'],
    MENA: ['AE', 'SA', 'QA', 'KW'],
    AFRICA: ['ZA', 'NG', 'KE', 'EG'],
  },
  global: [
    { url: 'https://feeds.bloomberg.com/markets/news.rss', locale: 'en', category: 'finance', source: 'Bloomberg Markets', center: { lat: 40.7128, lon: -74.0060 }, radiusKm: 20000, priority: 1, reliability: 0.98 },
    { url: 'https://www.reuters.com/business/finance/rss', locale: 'en', category: 'finance', source: 'Reuters Business', center: { lat: 51.5074, lon: -0.1278 }, radiusKm: 20000, priority: 2, reliability: 0.98 },
    { url: 'https://www.investing.com/rss/news_25.rss', locale: 'en', category: 'finance', source: 'Investing.com', center: { lat: 31.7683, lon: 35.2137 }, radiusKm: 20000, priority: 3, reliability: 0.85 },
  ],
};

/**
 * Calculate distance between two lat/lon points using Haversine formula
 * @returns distance in kilometers
 */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Get region key for a country code
 */
export function getRegionForCountry(country: string | null): keyof RegionMap | null {
  if (!country) return null;
  const regions: Record<string, keyof RegionMap> = {
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
  return regions[country] ?? null;
}

/**
 * Resolve vicinity feeds for a user location
 * Returns feeds sorted by: tier order > distance > priority > reliability (desc)
 * Capped at 12 feeds max
 */
export function resolveVicinityFeeds(userLat: number, userLon: number, userCountry: string | null): VicinityFeedWithMeta[] {
  const qualified: VicinityFeedWithMeta[] = [];

  // 1. City feeds
  for (const feed of TIERED_FEED_REGISTRY.city) {
    const dist = haversineKm(userLat, userLon, feed.center.lat, feed.center.lon);
    if (dist <= feed.radiusKm) {
      qualified.push({ ...feed, distanceKm: dist, tier: 'city' });
    }
  }

  // 2. Province feeds
  for (const feed of TIERED_FEED_REGISTRY.province) {
    const dist = haversineKm(userLat, userLon, feed.center.lat, feed.center.lon);
    if (dist <= feed.radiusKm) {
      qualified.push({ ...feed, distanceKm: dist, tier: 'province' });
    }
  }

  // 3. Country feeds
  if (userCountry && TIERED_FEED_REGISTRY.country[userCountry]) {
    for (const feed of TIERED_FEED_REGISTRY.country[userCountry]) {
      const dist = haversineKm(userLat, userLon, feed.center.lat, feed.center.lon);
      if (dist <= feed.radiusKm) {
        qualified.push({ ...feed, distanceKm: dist, tier: 'country' });
      }
    }
  }

  // 4. Region feeds (neighboring countries)
  const region = getRegionForCountry(userCountry);
  if (region && TIERED_FEED_REGISTRY.region[region]) {
    for (const countryCode of TIERED_FEED_REGISTRY.region[region]) {
      if (countryCode === userCountry) continue;
      const countryFeeds = TIERED_FEED_REGISTRY.country[countryCode] || [];
      for (const feed of countryFeeds) {
        const dist = haversineKm(userLat, userLon, feed.center.lat, feed.center.lon);
        if (dist <= feed.radiusKm) {
          qualified.push({ ...feed, distanceKm: dist, tier: 'region' });
        }
      }
    }
  }

  // 5. Global fallback
  for (const feed of TIERED_FEED_REGISTRY.global) {
    qualified.push({ ...feed, distanceKm: 99999, tier: 'global' });
  }

  // Sort: tier order > distance > priority > reliability (desc)
  const tierOrder: Record<Tier, number> = { city: 0, province: 1, country: 2, region: 3, global: 4 };
  return qualified
    .sort((a, b) => {
      const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
      if (tierDiff !== 0) return tierDiff;
      if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.reliability - a.reliability;
    })
    .slice(0, 12); // Cap at 12 feeds max
}