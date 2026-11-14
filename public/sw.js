const CACHE_NAME = "revant-shell-v6";
const OFFLINE_URL = "/offline.html";
const SHELL_URLS = [OFFLINE_URL, "/images/logo-revant-app-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith("revant-shell-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Never cache personalized, authenticated, administrative, or API responses.
  if (
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/compte") ||
    url.pathname.startsWith("/connexion") ||
    url.pathname.startsWith("/inscription")
  ) return;

  // Keep the live site fresh; show the small, self-contained shell on network failure.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const offlinePage = await caches.match(OFFLINE_URL);
        return offlinePage || new Response(
          "<!doctype html><html lang=\"fr\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Revant hors connexion</title><body style=\"font:16px system-ui;padding:32px;color:#111\"><h1>Revant</h1><p>Connexion indisponible. Réessaie lorsque le réseau sera revenu.</p></body></html>",
          { headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      })
    );
  }
});