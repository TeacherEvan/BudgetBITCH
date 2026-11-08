'use client';

import { useEffect } from 'react';
import { initWebVitals } from '@/lib/web-vitals';
import { initObservability } from '@/lib/observability/logger';

/**
 * Client component that initializes web-vitals collection on mount.
 * Renders nothing — side effect only.
 */
export function WebVitalsInitializer(): null {
  useEffect(() => {
    initWebVitals();
    initObservability();
  }, []);

  return null;
}