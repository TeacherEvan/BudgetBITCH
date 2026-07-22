// next.config.ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: {
    root: __dirname,
  },
};

// NOTE: PWA is handled by the hand-written public/sw.js (registered in
// src/components/pwa/pwa-register.tsx). next-pwa was removed because v5 writes
// its own sw.js into public/ at build time (dest: "public"), which overwrites
// the curated Service Worker below and makes caching non-deterministic.
export default withNextIntl(nextConfig);
