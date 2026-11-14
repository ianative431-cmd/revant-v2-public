const CACHE_NAME = "revant-shell-v6";
const OFFLINE_URL = "/offline.html";
const LAUNCH_VIDEO_URL = "/media/revant-launch.mp4";
const SHELL_URLS = [OFFLINE_URL, "/images/logo-revant-app-512.png", LAUNCH_VIDEO_URL];

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

async function cachedLaunchVideoResponse(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(LAUNCH_VIDEO_URL);
  if (!cached) return fetch(request);

  const range = request.headers.get("range");
  if (!range) return cached;

  const bytes = await cached.arrayBuffer();
  const total = bytes.byteLength;
  const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!match || (!match[1] && !match[2])) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${total}` } });
  }

  let start;
  let end;
  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${total}` } });
    }
    start = Math.max(total - suffixLength, 0);
    end = total - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : total - 1;
  }

  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= total || end < start) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${total}` } });
  }
  end = Math.min(end, total - 1);

  return new Response(bytes.slice(start, end + 1), {
    status: 206,
    headers: {
      "Accept-Ranges": "bytes",
      "Content-Length": String(end - start + 1),
      "Content-Range": `bytes ${start}-${end}/${total}`,
      "Content-Type": cached.headers.get("Content-Type") || "video/mp4",
    },
  });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Serve the original launch video from the precache, including byte-range requests.
  if (url.pathname === LAUNCH_VIDEO_URL) {
    event.respondWith(cachedLaunchVideoResponse(request));
    return;
  }

  // Never cache personalized, authenticated, administrative, or API responses.
  if (
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/compte") ||
    url.pathname.startsWith("/connexion") ||
    url.pathname.startsWith("/inscription")
  ) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match(OFFLINE_URL)) || Response.error())
    );
  }
});
