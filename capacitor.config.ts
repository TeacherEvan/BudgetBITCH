import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Budget Boss (BudgetBITCH repo) — Capacitor configuration.
 *
 * Strategy: this app keeps a live Next.js server (it uses a server route at
 * /api/news and a hosted Convex backend) plus a hosted-Convex PWA. Capacitor
 * therefore wraps the *deployed web app* in a native WebView rather than
 * bundling a static export. `server.url` points the native shell at the
 * running site.
 *
 * - PROD: set CAPACITOR_SERVER_URL to the live Vercel URL (e.g. via .env).
 * - DEV:  point at the local dev server (default below) so you can iterate
 *         on the web app and hot-reload inside the emulator.
 *
 * To switch to a fully-bundled static app later, set `webDir: 'out'` (after
 * enabling `output: 'export'` in next.config.mjs) and drop `server.url`.
 */
const prodServerUrl = process.env.CAPACITOR_SERVER_URL?.trim();
const devServerUrl = 'http://10.0.2.2:3100'; // 10.0.2.2 is the Android emulator host loopback.

const config: CapacitorConfig = {
  appId: 'com.budgetbitch.app',
  appName: 'Budget Boss',
  // `webDir` is unused while server.url is set, but kept so a future static
  // export build (`next build` -> out/) has a declared copy target.
  webDir: 'out',
  server: {
    // When unset, falls back to devServerUrl at config-load time below.
    url: prodServerUrl || devServerUrl,
    cleartext: true, // allow http for local dev / LAN testing
  },
  android: {
    // Keep the WebView from being killed under memory pressure on budget devices.
    webContentsDebuggingEnabled: true,
  },
  ios: {
    contentInset: 'always',
  },
};

export default config;
