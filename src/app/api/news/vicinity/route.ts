import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { resolveVicinityFeeds, VicinityFeedWithMeta } from '@/lib/news/vicinity-resolver';
import type { NewsItem } from '@/lib/types/budget';

const parser = new Parser();

function getActionableText(item: { title: string; category: string }, locale: 'th' | 'en'): string | undefined {
  const lower = item.title.toLowerCase();

  if (locale === 'th') {
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
  } else {
    if (lower.includes('fuel') || lower.includes('gas') || lower.includes('diesel') || lower.includes('petrol')) {
      return 'Check fuel prices before filling up';
    }
    if (lower.includes('1+1') || lower.includes('buy 1 get 1') || lower.includes('buy one get one')) {
      return 'Found 1+1 deal - buy now';
    }
    if (lower.includes('discount') || lower.includes('sale') || lower.includes('promo') || lower.includes('offer')) {
      return 'Discount available - consider buying';
    }
    if (lower.includes('electricity') || lower.includes('power bill')) {
      return 'Check electricity rates - prices may change';
    }
  }
  return undefined;
}

async function fetchFeedItems(feed: VicinityFeedWithMeta): Promise<NewsItem[]> {
  try {
    const parsed = await parser.parseURL(feed.url);
    return parsed.items.map(parsedItem => {
      const actionable = getActionableText({ title: parsedItem.title || '', category: feed.category }, feed.locale);
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
  } catch (err) {
    console.error(`Failed to fetch ${feed.source}:`, err);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = parseFloat(searchParams.get('lat') || '');
    const lon = parseFloat(searchParams.get('lon') || '');
    const _locale = (searchParams.get('locale') as 'th' | 'en') || 'th';
    const country = searchParams.get('country')?.toUpperCase() || null;

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json(
        { error: 'Invalid lat/lon parameters' },
        { status: 400 }
      );
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinate range' },
        { status: 400 }
      );
    }

    const feeds = resolveVicinityFeeds(lat, lon, country);

    // Fetch all feeds in parallel
    const feedResults = await Promise.all(
      feeds.map(feed => fetchFeedItems(feed))
    );

    // Flatten and deduplicate by link
    const allItems: NewsItem[] = [];
    const seenLinks = new Set<string>();

    for (const items of feedResults) {
      for (const item of items) {
        if (!seenLinks.has(item.link)) {
          seenLinks.add(item.link);
          allItems.push(item);
        }
      }
    }

    // Sort by pubDate descending (newest first)
    allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    return NextResponse.json({ items: allItems });
  } catch (error) {
    console.error('[vicinity-news-api] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}