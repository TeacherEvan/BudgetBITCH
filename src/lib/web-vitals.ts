'use client';

import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

type VitalsHandler = (metric: Metric) => void;

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

declare global {
  interface Window {
    gtag?: (command: string, targetId: string, config?: Record<string, unknown>) => void;
  }
}

/**
 * Send a web-vitals metric to Google Analytics 4 or custom endpoint.
 * Falls back to console in development.
 */
function sendToAnalytics(metric: Metric): void {
  const payload = {
    name: metric.name,
    value: Math.round(metric.value),
    delta: Math.round(metric.delta),
    id: metric.id,
    rating: metric.rating,
    navigationType: metric.navigationType,
    timestamp: Date.now(),
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', payload);
    return;
  }

  // Send to Google Analytics 4 via gtag
  if (GA_MEASUREMENT_ID && typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', metric.name, {
      value: payload.value,
      metric_id: metric.id,
      metric_delta: payload.delta,
      metric_rating: metric.rating,
      non_interaction: true,
    });
    return;
  }

  // Fallback: POST to custom endpoint
  if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
    const body = JSON.stringify(payload);
    navigator.sendBeacon('/api/vitals', body);
  } else if (typeof fetch !== 'undefined') {
    fetch('/api/vitals', {
      method: 'POST',
      body: JSON.stringify(payload),
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {
      // Silently fail - vitals collection is best-effort
    });
  }
}

/**
 * Initialize web-vitals collection. Call once at app startup (client-side).
 */
export function initWebVitals(): void {
  // Only run in browser
  if (typeof window === 'undefined') return;

  // Each metric fires once per page load
  onCLS(sendToAnalytics);
  onFCP(sendToAnalytics);
  onINP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}

/**
 * Hook for components that want to track custom metrics.
 */
export function useWebVitals(): VitalsHandler {
  return sendToAnalytics;
}

/**
 * Manually report a custom metric (e.g., interaction latency).
 */
export function reportMetric(name: string, value: number, rating: 'good' | 'needs-improvement' | 'poor'): void {
  // Build a complete Metric object. `navigationId` is required by the
  // web-vitals v5 Metric type (number, not optional) — use 0 as the sentinel
  // for manually-reported metrics that aren't tied to a soft navigation.
  const metric: Metric = {
    name: name as Metric['name'],
    value: Math.round(value),
    delta: 0,
    id: crypto.randomUUID(),
    rating,
    navigationType: 'navigate',
    navigationId: 0,
    entries: [] as PerformanceEntry[],
  };
  sendToAnalytics(metric);
}