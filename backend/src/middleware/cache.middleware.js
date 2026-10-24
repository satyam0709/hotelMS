/**
 * High-performance, lightweight in-memory cache middleware for public read GET endpoints.
 * Caches serialized responses for a configurable TTL (in seconds) to avoid database round-trips
 * on high-frequency public queries (e.g. rooms, amenities, facilities, pages, testimonials).
 */
const cacheStore = new Map();

const MAX_CACHE_ENTRIES = 250;

function apiCache(ttlSeconds = 60) {
  return function cacheMiddleware(req, res, next) {
    if (req.method !== "GET" || req.headers.authorization) {
      return next();
    }

    const key = `${req.baseUrl || ""}${req.path}?${new URLSearchParams(req.query || {}).toString()}`;
    const cached = cacheStore.get(key);

    if (cached && Date.now() < cached.expiresAt) {
      res.setHeader("X-Cache", "HIT");
      res.setHeader("Cache-Control", `public, max-age=${ttlSeconds}, stale-while-revalidate=120`);
      return res.status(cached.status).json(cached.body);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        if (cacheStore.size >= MAX_CACHE_ENTRIES) {
          const oldest = cacheStore.keys().next().value;
          if (oldest) cacheStore.delete(oldest);
        }
        cacheStore.set(key, {
          status: res.statusCode,
          body,
          expiresAt: Date.now() + ttlSeconds * 1000,
        });
        res.setHeader("X-Cache", "MISS");
        res.setHeader("Cache-Control", `public, max-age=${ttlSeconds}, stale-while-revalidate=120`);
      }
      return originalJson(body);
    };

    next();
  };
}

function invalidateApiCacheOnWrite(req, res, next) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return next();
  res.on("finish", () => {
    if (res.statusCode >= 200 && res.statusCode < 400) clearApiCache();
  });
  next();
}

function clearApiCache() {
  cacheStore.clear();
}

module.exports = { apiCache, clearApiCache, invalidateApiCacheOnWrite };
