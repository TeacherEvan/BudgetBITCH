// lib/news/rss-fetcher.ts
import Parser from 'rss-parser';
import type { NewsItem } from '@/lib/types/budget';

const parser = new Parser();

const RSS_FEEDS = [
  // International / English sources
  { url: 'https://www.reuters.com/business/finance/rss', locale: 'en' as const, category: 'finance' as const, source: 'Reuters Business' },
  { url: 'https://www.reuters.com/world/rss', locale: 'en' as const, category: 'economy' as const, source: 'Reuters World' },
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

export async function fetchNews(): Promise<NewsItem[]> {
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
    }
  }
  
  return allItems;
}

/**
 * Get cached news or fetch fresh
 */
let newsCache: NewsItem[] | null = null;
let lastFetch = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

export async function getNewsByLocale(locale: string): Promise<NewsItem[]> {
  const now = Date.now();
  
  if (newsCache && (now - lastFetch) < CACHE_TTL) {
    return newsCache.filter(item => item.locale === locale);
  }
  
  const allNews = await fetchNews();
  newsCache = allNews;
  lastFetch = now;
  
  return allNews.filter(item => item.locale === locale);
}