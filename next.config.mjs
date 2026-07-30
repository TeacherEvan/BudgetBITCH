import createNextIntlPlugin from "next-intl/plugin";
import { fileURLToPath } from "url";
import { dirname } from "path";

const withNextIntl = createNextIntlPlugin();
const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
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