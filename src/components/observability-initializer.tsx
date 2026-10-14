'use client';

import { useEffect } from 'react';
import { initObservability } from '@/lib/observability/logger';

/**
 * Client component that boots the structured telemetry layer on mount:
 * global error/unhandledrejection capture + periodic beacon flush. Renders
 * nothing — side effect only. Mirrors web-vitals-initializer.tsx.
 */
export function ObservabilityInitializer(): null {
  useEffect(() => {
    initObservability();
  }, []);
  return null;
}
