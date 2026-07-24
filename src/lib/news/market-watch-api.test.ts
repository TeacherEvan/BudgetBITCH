import { NextRequest } from 'next/server';
import { GET } from '@/app/api/news/vicinity/route';
import { vi } from 'vitest';

vi.mock('rss-parser', () => {
  return {
    default: class MockParser {
      parseURL = vi.fn().mockResolvedValue({
        items: [
          { title: 'Test News', link: 'https://example.com/1', pubDate: new Date().toISOString() },
          { title: 'Fuel price drop', link: 'https://example.com/2', pubDate: new Date().toISOString() },
        ]
      });
    }
  };
});

describe('market-watch-api', () => {
  it('returns 200 with items array', async () => {
    const request = new NextRequest(new URL('http://localhost/api/news/vicinity?lat=13.7563&lon=100.5018&locale=th&country=TH'));
    const response = await GET(request);
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBeGreaterThan(0);
  });

  it('returns actionable text for fuel in Thai locale', async () => {
    const request = new NextRequest(new URL('http://localhost/api/news/vicinity?lat=13.7563&lon=100.5018&locale=th&country=TH'));
    const response = await GET(request);
    const data = await response.json();

    const fuelItem = data.items.find((i: { title: string; actionable?: string }) => i.title.includes('Fuel'));
    expect(fuelItem?.actionable).toContain('เช็คราคาน้ำมัน');
  });

  it('returns 400 for invalid lat/lon', async () => {
    const request = new NextRequest(new URL('http://localhost/api/news/vicinity?lat=invalid&lon=100.5018'));
    const response = await GET(request);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('returns 400 for out-of-range coordinates', async () => {
    const request = new NextRequest(new URL('http://localhost/api/news/vicinity?lat=100&lon=100.5018'));
    const response = await GET(request);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('deduplicates items by link', async () => {
    const request = new NextRequest(new URL('http://localhost/api/news/vicinity?lat=13.7563&lon=100.5018&locale=th&country=TH'));
    const response = await GET(request);
    const data = await response.json();

    const links = data.items.map((item: { link: string }) => item.link);
    const uniqueLinks = new Set(links);
    expect(links.length).toBe(uniqueLinks.size);
  });
});