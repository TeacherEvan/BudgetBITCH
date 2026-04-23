const APP_SHELL_CACHE = "bb-app-shell-v1";
const STATIC_ASSET_CACHE = "bb-static-assets-v1";
const SAFE_ROUTE_SHELLS = ["/", "/calculator", "/notes"];
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

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_ASSET_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await fetch(request);

  if (networkResponse.ok) {
    await cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

async function networkFirst(request) {
  const cache = await caches.open(APP_SHELL_CACHE);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
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
    event.respondWith(cacheFirst(event.request));
    return;
  }

  if (isSafeShellRequest(event.request, requestUrl)) {
    event.respondWith(networkFirst(event.request));
  }
});