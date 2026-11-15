const CACHE_NAME = "revant-shell-v7";
const OFFLINE_URL = "/offline.html";
const LAUNCH_VIDEO_URL = "/media/revant-launch.mp4";
const SHELL_URLS = [OFFLINE_URL, "/images/logo-revant-app-512.png", LAUNCH_VIDEO_URL];
const CATALOGUE_CACHE_NAME = "revant-public-catalogue-v1";
const CATALOGUE_KEY = "/__revant_public_catalogue__";
const MAX_CATALOGUE_ITEMS = 12;
const MAX_IMAGE_BYTES = 1572864;

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
    return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + total } });
  }

  let start;
  let end;
  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) {
      return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + total } });
    }
    start = Math.max(total - suffixLength, 0);
    end = total - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : total - 1;
  }

  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= total || end < start) {
    return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + total } });
  }
  end = Math.min(end, total - 1);

  return new Response(bytes.slice(start, end + 1), {
    status: 206,
    headers: {
      "Accept-Ranges": "bytes",
      "Content-Length": String(end - start + 1),
      "Content-Range": "bytes " + start + "-" + end + "/" + total,
      "Content-Type": cached.headers.get("Content-Type") || "video/mp4",
    },
  });
}

async function savePublicCatalogue(data) {
  if (!data || !Array.isArray(data.products) || !Number.isFinite(data.savedAt)) return;
  const allowedOrigin = typeof data.storageOrigin === "string" ? data.storageOrigin : "";
  let storageOrigin = "";
  try {
    const parsedOrigin = new URL(allowedOrigin);
    if (parsedOrigin.protocol === "https:") storageOrigin = parsedOrigin.origin;
  } catch {
    storageOrigin = "";
  }

  const products = data.products.slice(0, MAX_CATALOGUE_ITEMS).flatMap((item) => {
    if (
      !item ||
      typeof item.id !== "string" ||
      typeof item.name !== "string" ||
      !Number.isFinite(item.price) ||
      item.price < 0 ||
      typeof item.currency !== "string" ||
      typeof item.stock !== "number" ||
      !Number.isFinite(item.stock)
    ) return [];

    let image = "";
    if (typeof item.image === "string" && storageOrigin) {
      try {
        const candidate = new URL(item.image);
        if (
          candidate.protocol === "https:" &&
          candidate.origin === storageOrigin &&
          candidate.pathname.startsWith("/storage/v1/object/public/product-images/") &&
          !candidate.username &&
          !candidate.password
        ) image = candidate.toString();
      } catch {
        image = "";
      }
    }

    return [{
      id: item.id.slice(0, 80),
      name: item.name.slice(0, 120),
      price: item.price,
      currency: item.currency.slice(0, 8),
      stock: Math.max(0, Math.floor(item.stock)),
      category: typeof item.category === "string" ? item.category.slice(0, 60) : "",
      image,
    }];
  });

  if (!products.length) return;
  const assetCache = await caches.open(CATALOGUE_CACHE_NAME);
  const keepImages = new Set();

  for (const product of products) {
    if (!product.image) continue;
    keepImages.add(product.image);
    try {
      if (await assetCache.match(product.image)) continue;
      const response = await fetch(product.image, { mode: "cors", credentials: "omit", cache: "no-store" });
      const length = Number(response.headers.get("content-length") || 0);
      const contentType = response.headers.get("content-type") || "";
      if (
        !response.ok ||
        response.type === "opaque" ||
        !contentType.toLowerCase().startsWith("image/") ||
        (length > 0 && length > MAX_IMAGE_BYTES)
      ) continue;
      const blob = await response.clone().blob();
      if (blob.size > MAX_IMAGE_BYTES) continue;
      await assetCache.put(product.image, response);
    } catch {
      // A failed image must not prevent saving the public catalogue metadata.
    }
  }

  const oldAssets = await assetCache.keys();
  await Promise.all(oldAssets
    .filter((request) => request.url !== new URL(CATALOGUE_KEY, self.location.origin).href && !keepImages.has(request.url))
    .map((request) => assetCache.delete(request)));

  const payload = {
    savedAt: data.savedAt,
    products: products.map(({ id, name, price, currency, stock, category, image }) => ({
      id, name, price, currency, stock, category, image,
    })),
  };
  await assetCache.put(
    CATALOGUE_KEY,
    new Response(JSON.stringify(payload), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    }),
  );
}

self.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "REVANT_CACHE_PUBLIC_CATALOGUE") return;
  event.waitUntil(savePublicCatalogue(event.data).catch(() => undefined));
});

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
