// app/api/news/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';
import type { NewsItem } from '@/lib/types/budget';

const parser = new Parser({
  timeout: 5000,
});

const RSS_FEEDS = [
  // Thai sources - Bangkok Post Business works
  { url: 'https://www.bangkokpost.com/rss/data/business.xml', locale: 'th' as const, category: 'finance' as const, source: 'Bangkok Post Business' },
  // English sources - use feeds that work
  { url: 'https://feeds.bloomberg.com/markets/news.rss', locale: 'en' as const, category: 'finance' as const, source: 'Bloomberg Markets' },
  { url: 'https://www.marketwatch.com/rss/topstories', locale: 'en' as const, category: 'finance' as const, source: 'MarketWatch' },
  { url: 'https://www.investing.com/rss/news_25.rss', locale: 'en' as const, category: 'finance' as const, source: 'Investing.com' },
];

function getActionableText(item: { title: string; category: string }): string | undefined {
  const lower = item.title.toLowerCase();

  if (lower.includes('fuel') || lower.includes('น้ำมัน') || lower.includes('gas') || lower.includes('diesel')) {
    return 'เช็คราคาน้ำมันก่อนเติม';
  }
  if (lower.includes('1+1') || lower.includes('buy 1') || lower.includes('ซื้อ 1 แถม 1')) {
    return 'เจอโปรโมชั่น 1+1 - จัดซื้อได้เลย';
  }
  if (lower.includes('discount') || lower.includes('sale') || lower.includes('ลดราคา') || lower.includes('โปรโมชั่น')) {
    return 'มีส่วนลด - พิจารณาซื้อ';
  }
  if (lower.includes('bts') || lower.includes('mrt') || lower.includes('บีทีเอส') || lower.includes('บัตรประจำเดือน')) {
    return 'เช็คบัตรประจำเดือนประหยัดกว่าซื้อรายวัน';
  }
  if (lower.includes('electricity') || lower.includes('ค่าไฟ')) {
    return 'ตรวจสอบค่าไฟ - อาจมีการปรับราคา';
  }
  return undefined;
}

// Cache for 6 hours
let newsCache: NewsItem[] | null = null;
let lastFetch = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000;

async function fetchAllNews(): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      const parsed = await parser.parseURL(feed.url);
      return parsed.items.map((parsedItem) => {
        const actionable = getActionableText({ title: parsedItem.title || '', category: feed.category });
        return {
          title: parsedItem.title || 'Untitled',
          link: parsedItem.link || '',
          pubDate: parsedItem.pubDate || new Date().toISOString(),
          source: feed.source,
          category: feed.category,
          locale: feed.locale,
          actionable,
        };
      });
    })
  );

  const allItems: NewsItem[] = [];
  for (let i = 0; i < results.length; i++) {
    const res = results[i];
    if (res.status === 'fulfilled') {
      allItems.push(...res.value);
    } else {
      console.error(`Failed to fetch ${RSS_FEEDS[i].source}:`, res.reason);
    }
  }

  return allItems;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get('locale') as 'th' | 'en' | null;
  // Location-driven: a resolved country selects the feed locale.
  const country = searchParams.get('country');
  const effectiveLocale: 'th' | 'en' = country === 'TH' ? 'th' : (localeParam ?? 'en');

  const now = Date.now();

  // Use cache if valid
  if (newsCache && (now - lastFetch) < CACHE_TTL) {
    const filtered = newsCache.filter(item => item.locale === effectiveLocale);
    return NextResponse.json({ items: filtered });
  }

  try {
    const allNews = await fetchAllNews();
    newsCache = allNews;
    lastFetch = now;

    const filtered = allNews.filter(item => item.locale === effectiveLocale);
    return NextResponse.json({ items: filtered });
  } catch (error) {
    console.error('Failed to fetch news:', error);
    // Return cached data even if stale on error
    if (newsCache) {
      const filtered = newsCache.filter(item => item.locale === effectiveLocale);
      return NextResponse.json({ items: filtered, stale: true });
    }
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}