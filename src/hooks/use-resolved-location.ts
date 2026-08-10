'use client';

import { useState, useEffect, useCallback } from 'react';
import { getLocationCache } from '@/lib/db/local-db';
import { requestAndPersistLocation } from '@/modules/home-base/location-permission';

export interface ResolvedLocation {
  lat: number;
  lon: number;
}

export function useResolvedLocation(): {
  location: ResolvedLocation | null;
  country: string | null;
  requestLocation: () => Promise<boolean>;
} {
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

  const requestLocation = useCallback(async () => {
    const res = await requestAndPersistLocation();
    if (res) {
      setLocation({ lat: res.lat, lon: res.lon });
      setCountry(res.country ?? null);
      return true;
    }
    return false;
  }, []);

  return { location, country, requestLocation };
}