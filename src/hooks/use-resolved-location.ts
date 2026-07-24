'use client';

import { useState, useEffect } from 'react';
import { getLocationCache } from '@/lib/db/local-db';

export interface ResolvedLocation {
  lat: number;
  lon: number;
}

export function useResolvedLocation(): { location: ResolvedLocation | null; country: string | null } {
  const [location, setLocation] = useState<ResolvedLocation | null>(null);
  const [country, setCountry] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getLocationCache()
      .then((cache) => {
        if (mounted && cache) {
          setLocation({ lat: cache.lat, lon: cache.lon });
          setCountry(cache.country ?? null);
        }
      })
      .catch(() => {
        if (mounted) {
          setLocation(null);
          setCountry(null);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { location, country };
}