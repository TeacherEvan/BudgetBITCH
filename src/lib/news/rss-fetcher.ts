// lib/news/rss-fetcher.ts
import Parser from 'rss-parser';
import type { NewsItem } from '@/lib/types/budget';

const parser = new Parser();

const RSS_FEEDS = [
  // Thai sources
  { url: 'https://www.bangkokpost.com/rss/data/business.xml', locale: 'th' as const, category: 'finance' as const, source: 'Bangkok Post Business' },
  { url: 'https://www.bangkokpost.com/rss/data/general.xml', locale: 'th' as const, category: 'local' as const, source: 'Bangkok Post' },
  { url: 'https://englishnews.thaipbs.or.th/rss', locale: 'th' as const, category: 'local' as const, source: 'Thai PBS' },
  { url: 'https://www.pptvhd36.com/rss', locale: 'th' as const, category: 'local' as const, source: 'PPTV' },
  // English sources
  { url: 'https://www.reuters.com/business/finance/rss', locale: 'en' as const, category: 'finance' as const, source: 'Reuters Business' },
  { url: 'https://www.reuters.com/world/rss', locale: 'en' as const, category: 'economy' as const, source: 'Reuters World' },
];

function getActionableText(item: { title: string; category: string }): string | undefined {
  const lower = item.title.toLowerCase();
  
  if (lower.includes('fuel') || lower.includes('n้ำมัน') || lower.includes('gas') || lower.includes('diesel')) {
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

export async function getNewsByLocale(locale: 'th' | 'en'): Promise<NewsItem[]> {
  const now = Date.now();
  
  if (newsCache && (now - lastFetch) < CACHE_TTL) {
    return newsCache.filter(item => item.locale === locale);
  }
  
  const allNews = await fetchNews();
  newsCache = allNews;
  lastFetch = now;
  
  return allNews.filter(item => item.locale === locale);
}