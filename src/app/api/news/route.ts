// app/api/news/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';
import type { NewsItem } from '@/lib/types/budget';

const parser = new Parser();

const RSS_FEEDS = [
  // English sources - use feeds that work
  { url: 'https://feeds.bloomberg.com/markets/news.rss', locale: 'en' as const, category: 'finance' as const, source: 'Bloomberg Markets' },
  { url: 'https://www.marketwatch.com/rss/topstories', locale: 'en' as const, category: 'finance' as const, source: 'MarketWatch' },
  { url: 'https://www.investing.com/rss/news_25.rss', locale: 'en' as const, category: 'finance' as const, source: 'Investing.com' },
];

function getActionableText(item: { title: string; category: string }): string | undefined {
  const lower = item.title.toLowerCase();

  if (lower.includes('fuel') || lower.includes('gas') || lower.includes('diesel')) {
    return 'Check fuel prices before filling up';
  }
  if (lower.includes('1+1') || lower.includes('buy 1')) {
    return 'Buy-one-get-one promo spotted - stock up';
  }
  if (lower.includes('discount') || lower.includes('sale')) {
    return 'Discount running - consider buying now';
  }
  if (lower.includes('electricity') || lower.includes('power tariff')) {
    return 'Check your electricity tariff - rates may be changing';
  }
  return undefined;
}

// Cache for 6 hours
let newsCache: NewsItem[] | null = null;
let lastFetch = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000;

async function fetchAllNews(): Promise<NewsItem[]> {
  const allItems: NewsItem[] = [];

  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      const items = parsed.items.map(parsedItem => {
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
      allItems.push(...items);
    } catch (err) {
      console.error(`Failed to fetch ${feed.source}:`, err);
      // Continue with other feeds even if one fails
    }
  }

  return allItems;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get('locale') as string | null;
  const effectiveLocale: string = localeParam ?? 'en';

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