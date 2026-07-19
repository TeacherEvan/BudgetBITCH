import type { NextRequest } from "next/server";

/**
 * Extracts the originating client IP from the real request headers.
 *
 * This must run on the server (a Next.js Route Handler), never inside a
 * Convex mutation — Convex mutations execute over a WebSocket and cannot see
 * the HTTP request, so the client IP is not available there. We read the
 * forwarding header that the platform/proxy sets, which the client cannot
 * spoof.
 */
export function clientIp(req: NextRequest): string | undefined {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    // First hop is the original client; subsequent entries are proxies.
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || undefined;
}
