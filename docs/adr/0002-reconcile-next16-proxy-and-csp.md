# 0002: Reconcile Next.js 16 Proxy Convention & Strict CSP Allowlist

- **Status:** Proposed
- **Date:** 2026-11-08
- **Context:**
  Next.js 16 deprecated `middleware.ts` in favor of `proxy.ts`, which must reside in `src/proxy.ts` (sibling to `src/app/`). The codebase had a file at `src/app/proxy.ts`, making it completely inactive. Concurrently, `vercel.json` specified edge headers with a static Content-Security-Policy that allowed `https://api.frankfurter.dev`, while `next.config.mjs` restricted `Permissions-Policy: camera=()` (which breaks camera receipt capture on non-Vercel environments).
- **Decision:**
  1. Relocate and align proxy behavior to standard Next.js 16 conventions while synchronizing `connect-src` to include `https://api.frankfurter.dev`, `https://*.convex.cloud`, and `https://*.convex.site`.
  2. Unify `Permissions-Policy: camera=(self), microphone=(), geolocation=(self)` across `next.config.mjs` and `vercel.json`.
- **Consequences:**
  - Positive: Ensures camera receipt scanning operates identically across local development, Docker, and Vercel.
  - Positive: Prevents CSP blocks on Frankfurter currency exchange rates and Convex site URLs.
- **Alternatives Considered:**
  - Leaving `camera=()` in `next.config.mjs`: Rejected because receipt capture is a flagship feature.
