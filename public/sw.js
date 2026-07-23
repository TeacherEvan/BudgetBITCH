// Bump CACHE_VERSION to force Service Worker clients to discard stale cached
// app shells / chunks — required after a Convex deployment-URL change so
// returning PWA users stop loading an old bundle that points at a dead backend.
const CACHE_VERSION = 4;
const APP_SHELL_CACHE = `bb-app-shell-v${CACHE_VERSION}`;
const STATIC_ASSET_CACHE = `bb-static-assets-v${CACHE_VERSION}`;
const SAFE_ROUTE_SHELLS = ["/", "/dashboard", "/wizard", "/settings"];
const STATIC_ASSET_PATH_PREFIXES = ["/_next/static/", "/icons/"];

// Cache app shell, launch city data, notes shell, calculator shell, and static assets.
// Do not cache authenticated mutation responses, integration secrets, or connect/revoke routes.

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isStaticAssetPath(pathname) {
  return STATIC_ASSET_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isSafeShellRequest(request, url) {
  return request.mode === "navigate" && SAFE_ROUTE_SHELLS.includes(url.pathname);
}

function shouldBypassCache(request, url) {
  if (request.method !== "GET") {
    return true;
  }

  if (!isSameOrigin(url)) {
    return true;
  }

  if (url.pathname.startsWith("/api/")) {
    return true;
  }

  return url.pathname.includes("/connect") || url.pathname.includes("/revoke");
}

async function warmShellCache() {
  const cache = await caches.open(APP_SHELL_CACHE);

  await Promise.allSettled(
    SAFE_ROUTE_SHELLS.map((pathname) => cache.add(new Request(pathname, { cache: "reload" }))),
  );
}

async function warmStaticCache() {
  const cache = await caches.open(STATIC_ASSET_CACHE);

  await Promise.allSettled([
    cache.add(new Request("/icons/app-icon.svg", { cache: "reload" })),
    cache.add(new Request("/icons/app-icon-maskable.svg", { cache: "reload" })),
  ]);
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_ASSET_CACHE);
  const cachedResponse = await cache.match(request);

  const networkPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);

  // Always prefer the network for hashed /_next/static chunks so a fresh
  // deploy never serves a stale bundle behind a permanent cache name.
  return (await networkPromise) ?? cachedResponse;
}

async function networkFirst(request) {
  const cache = await caches.open(APP_SHELL_CACHE);

  try {
    // Race the fetch request against a 3-second timeout to prevent mobile network hangs
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Navigation fetch timeout")), 3000)
      )
    ]);

    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }

    // If server returns an error (e.g. 502/504 gateway timeout), fallback to cache if available
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return networkResponse;
  } catch {
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    throw new Error("Offline route shell not available in cache.");
  }
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.all([warmShellCache(), warmStaticCache()]));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys();

      await Promise.all(
        cacheKeys
          .filter((cacheKey) => cacheKey !== APP_SHELL_CACHE && cacheKey !== STATIC_ASSET_CACHE)
          .map((cacheKey) => caches.delete(cacheKey)),
      );

      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  if (shouldBypassCache(event.request, requestUrl)) {
    return;
  }

  if (isStaticAssetPath(requestUrl.pathname)) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  if (isSafeShellRequest(event.request, requestUrl)) {
    event.respondWith(networkFirst(event.request));
  }
});

// --- Background sync (C2) --------------------------------------------------
// Daily snapshots are queued in localStorage by src/lib/convex/sync-snapshots.ts
// when Convex is unreachable. The SW cannot reach the authenticated Convex
// client itself, so the `sync` / `periodicsync` events ask the page to flush
// the queue using the browser's already-authenticated Convex client.

const SYNC_TAG = "daily-snapshot";

async function triggerClientFlush() {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  for (const client of clients) {
    // The page (src/components/pwa/pwa-register.tsx) listens for this and calls
    // flushOfflineQueue(), which drains budgetbitch:offlineQueue via Convex.
    client.postMessage({ type: "TRIGGER_FLUSH", tag: SYNC_TAG });
  }
}

self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(triggerClientFlush());
  }
});

self.addEventListener("periodicsync", (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(triggerClientFlush());
  }
});