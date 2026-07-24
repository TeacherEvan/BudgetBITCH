'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  const { location, country } = useResolvedLocation();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const isFetchingRef = useRef(false);

  const fetchNews = useCallback(async () => {
    if (!location || isFetchingRef.current) {
      if (!location) {
        setItems([]);
        setLoading(false);
      }
      return;
    }

    isFetchingRef.current = true;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        lat: location.lat.toString(),
        lon: location.lon.toString(),
        locale,
        country: country || '',
      });

      const res = await fetch(`/api/news/vicinity?${params.toString()}`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
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

      localStorage.setItem(CACHE_KEY, JSON.stringify({ items: sorted, timestamp: Date.now(), locale }));
    } catch (err) {
      setError(locale === 'th' ? 'โหลดข่าวไม่สำเร็จ' : 'Failed to load news');
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { items, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL * 2) {
          setItems(items.slice(0, 10));
        }
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [location, locale, country]);

  // Use a ref to track if we've already fetched for the current location
  const fetchedLocationRef = useRef<string | null>(null);

  useEffect(() => {
    const locationKey = location ? `${location.lat},${location.lon},${locale},${country || ''}` : null;
    
    if (locationKey && locationKey !== fetchedLocationRef.current) {
      fetchedLocationRef.current = locationKey;
      fetchNews();
    } else if (!location) {
      // Use setTimeout to avoid setState in effect
      setTimeout(() => {
        setItems([]);
        setLoading(false);
        fetchedLocationRef.current = null;
      }, 0);
    }
  }, [location, locale, country, fetchNews]);

  return { items, loading, error, lastUpdated, refresh: fetchNews };
}