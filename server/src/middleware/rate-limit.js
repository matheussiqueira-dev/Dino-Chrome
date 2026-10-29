import { HttpError } from "../errors/http-error.js";

const MAX_TRACKED_CLIENTS = 10000;

export function createRateLimiter({ windowMs, max, now = () => Date.now(), maxTrackedClients = MAX_TRACKED_CLIENTS }) {
  const hits = new Map();

  function prune(currentTime) {
    for (const [key, bucket] of hits) {
      if (bucket.resetAt <= currentTime) {
        hits.delete(key);
      }
    }
  }

  return function rateLimitMiddleware(request, response, next) {
    const currentTime = now();
    const key = request.ip ?? "unknown";
    let bucket = hits.get(key);

    if (!bucket || bucket.resetAt <= currentTime) {
      if (hits.size >= maxTrackedClients) {
        prune(currentTime);
      }
      if (hits.size >= maxTrackedClients) {
        hits.delete(hits.keys().next().value);
      }
      bucket = { count: 0, resetAt: currentTime + windowMs };
      hits.set(key, bucket);
    }

    bucket.count += 1;
    const remaining = Math.max(0, max - bucket.count);
    response.setHeader("RateLimit-Limit", String(max));
    response.setHeader("RateLimit-Remaining", String(remaining));

    if (bucket.count > max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - currentTime) / 1000));
      response.setHeader("Retry-After", String(retryAfterSeconds));
      return next(new HttpError(429, "Muitas requisições. Tente novamente em instantes."));
    }

    return next();
  };
}
