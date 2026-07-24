// hooks/use-vicinity-feeds.test.tsx
import { renderHook, act, waitFor } from '@testing-library/react';
import { useVicinityFeeds } from '@/hooks/use-vicinity-feeds';
import { useResolvedLocation } from '@/hooks/use-resolved-location';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// Mock useResolvedLocation
let mockLocation: { lat: number; lon: number } | null = { lat: 13.7563, lon: 100.5018 };
let mockCountry: string | null = 'TH';

vi.mock('@/hooks/use-resolved-location', () => ({
  useResolvedLocation: () => ({
    location: mockLocation,
    country: mockCountry,
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('useVicinityFeeds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('fetches and caches vicinity feeds', async () => {
    const mockItems = [
      { title: 'News 1', link: 'https://a.com', pubDate: new Date().toISOString(), source: 'Test', category: 'finance', locale: 'th', actionable: 'Tip 1' },
      { title: 'News 2', link: 'https://b.com', pubDate: new Date().toISOString(), source: 'Test', category: 'fuel', locale: 'th' },
    ];

    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockItems }),
    });

    const { result } = renderHook(() => useVicinityFeeds('th'));

    // Should start loading
    expect(result.current.loading).toBe(true);

    // Wait for fetch
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.loading).toBe(false);
    expect(result.current.items.length).toBe(2);
    expect(result.current.items[0].actionable).toBe('Tip 1');
    expect(result.current.lastUpdated).toBeGreaterThan(0);
  });

  it('refreshes feeds on demand', async () => {
    const mockItems = [
      { title: 'News 1', link: 'https://a.com', pubDate: new Date().toISOString(), source: 'Test', category: 'finance', locale: 'th', actionable: 'Tip 1' },
      { title: 'News 2', link: 'https://b.com', pubDate: new Date().toISOString(), source: 'Test', category: 'fuel', locale: 'th' },
    ];

    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockItems }),
    });

    const { result } = renderHook(() => useVicinityFeeds('th'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [...mockItems, { title: 'News 3', link: 'https://c.com', pubDate: new Date().toISOString(), source: 'Test', category: 'deals', locale: 'th', actionable: 'Deal!' }] }),
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.items.length).toBe(3);
  });

  it('falls back to cache on error', async () => {
    const cachedItems = [
      { title: 'Cached News', link: 'https://cached.com', pubDate: new Date().toISOString(), source: 'Cached', category: 'finance', locale: 'th' },
    ];

    // Pre-populate cache
    localStorage.setItem('bb:vicinityNewsCache', JSON.stringify({ items: cachedItems, timestamp: Date.now(), locale: 'th' }));

    (fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useVicinityFeeds('th'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('โหลดข่าวไม่สำเร็จ');
    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].title).toBe('Cached News');
  });

  it('handles no location gracefully', async () => {
    mockLocation = null;
    mockCountry = null;

    const { result } = renderHook(() => useVicinityFeeds('th'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.items).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});