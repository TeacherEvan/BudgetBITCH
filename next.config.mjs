import createNextIntlPlugin from "next-intl/plugin";
import { fileURLToPath } from "url";
import { dirname } from "path";

const withNextIntl = createNextIntlPlugin();
const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    // CSP is now applied per-request with a nonce in src/app/proxy.ts
    // (required so Next.js 16's inline RSC/hydration scripts pass a strict
    // policy without 'unsafe-inline'). Non-CSP security headers stay here.
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
    ];
  },
};

// NOTE: PWA is handled by the hand-written public/sw.js (registered in
// src/components/pwa/pwa-register.tsx). next-pwa was removed because v5 writes
// its own sw.js into public/ at build time (dest: "public"), which overwrites
// the curated Service Worker below and makes caching non-deterministic.
export default withNextIntl(nextConfig);
