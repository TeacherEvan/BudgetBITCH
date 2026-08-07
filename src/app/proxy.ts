import { NextResponse, type NextRequest } from 'next/server';

/**
 * Content-Security-Policy with a per-request nonce.
 *
 * Next.js 16 emits inline RSC/hydration scripts that a strict
 * `script-src 'self'` policy (without `'unsafe-inline'`) blocks — breaking
 * hydration for real users AND failing the E2E "console-clean" assertion.
 *
 * The strict, XSS-resistant fix (per Next.js 16 docs) is a nonce + the
 * `x-nonce` request header: Next parses the `'nonce-{value}'` from the
 * CSP header and applies it to every framework/inline script automatically.
 * `strict-dynamic` then lets those nonce'd scripts load their own children
 * without widening the policy.
 *
 * All routes are already dynamically rendered (`cookies()` in the root
 * layout), which is required for nonce injection to work.
 */
function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development';
  return [
    "default-src 'self'",
    // nonce covers Next's inline RSC/hydration scripts; 'self' keeps
    // 'self'-hosted external scripts (service worker /sw.js, Next bundles)
    // working. No 'strict-dynamic' (it would override 'self' and block /sw.js).
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ''}`,
    // Inline <style> (CSS keyframes in components like GoldenSplash) cannot be
    // auto-nonced by Next, so 'unsafe-inline' is required for style-src.
    // This matches the original next.config.mjs policy and keeps XSS risk low
    // (scripts remain nonce-gated, not inline).
    `style-src 'self' 'unsafe-inline'`,
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    "worker-src 'self'",
    "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildCsp(nonce);

  // Forward the nonce to Next's renderer via the x-nonce request header.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  // Run on every route except static assets, API routes, and prefetches.
  matcher: [
    {
      source:
        '/((?!api|_next/static|_next/image|favicon.ico|manifest.json).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
