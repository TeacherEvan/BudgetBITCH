'use client';

import { useEffect } from 'react';
import { initWebVitals } from '@/lib/web-vitals';

/**
 * Client component that initializes web-vitals collection on mount.
 * Renders nothing — side effect only.
 */
export function WebVitalsInitializer(): null {
  useEffect(() => {
    initWebVitals();
  }, []);

  return null;
}