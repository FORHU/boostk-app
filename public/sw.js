// Boostk service worker — minimal, for PWA installability + app-shell caching only.
// This app is server-dependent (Postgres + RabbitMQ/SSE), so there is NO offline mode:
// navigations, API calls, server functions, and event streams always go straight to the
// network. We only cache immutable static build assets + icons to speed up warm loads.

// Replaced at build time by scripts/stamp-sw.mjs with a git SHA / timestamp so every
// deploy ships a changed sw.js — that byte change is what makes browsers detect updates.
const VERSION = "__BUILD_ID__";
const SHELL_CACHE = `boostk-shell-${VERSION}`;

// Static, backend-independent assets safe to pre-cache.
const PRECACHE = [
  "/manifest.json",
  "/favicon-32.png",
  "/favicon-16.png",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  // Do NOT skipWaiting automatically: a new version installs but stays "waiting" until
  // the user accepts the update prompt, so we never reload the page out from under them.
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE)).catch(() => {}),
  );
});

// The app posts { type: "SKIP_WAITING" } when the user clicks "Reload"; only then do we
// activate the new worker (which triggers a controllerchange -> page reload on the client).
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("boostk-shell-") && k !== SHELL_CACHE)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only ever touch same-origin GETs. Let the browser handle everything else
  // (POST/PUT, cross-origin, etc.) with no interference.
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  // Never intercept things that need the live backend:
  //  - navigations (SSR HTML from Nitro)
  //  - API + server-function routes
  //  - Server-Sent Events / streaming
  const accept = req.headers.get("accept") || "";
  if (
    req.mode === "navigate" ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/_serverFn") ||
    accept.includes("text/event-stream")
  ) {
    return;
  }

  // Only cache the static app shell: hashed build assets, scripts, styles, images, fonts.
  const isStatic =
    req.destination === "script" ||
    req.destination === "style" ||
    req.destination === "image" ||
    req.destination === "font" ||
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/_build/");
  if (!isStatic) return;

  // Stale-while-revalidate: instant warm loads, background refresh, no offline page.
  event.respondWith(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      const cached = await cache.match(req);
      if (cached) {
        event.waitUntil(
          fetch(req)
            .then((res) => {
              if (res && res.ok) cache.put(req, res.clone());
            })
            .catch(() => {}),
        );
        return cached;
      }
      try {
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      } catch {
        return cached || Response.error();
      }
    })(),
  );
});
