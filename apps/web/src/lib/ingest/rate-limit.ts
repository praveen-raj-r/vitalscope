export interface RateLimiterOptions {
  /** Bucket size: how many requests can burst at once. */
  capacity: number;
  /** Window over which a full bucket refills, in ms. 100 per 10 s means capacity 100, windowMs 10000. */
  windowMs: number;
  now?: () => number;
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until one more request is allowed (only when not ok). */
  retryAfterSec: number;
}

/**
 * Token bucket per key. State lives in this process's memory, so on serverless hosting each
 * instance has its own buckets: this is a best-effort guard, not an exact global limit.
 */
export function createRateLimiter({ capacity, windowMs, now = Date.now }: RateLimiterOptions) {
  const refillPerMs = capacity / windowMs;
  const buckets = new Map<string, { tokens: number; updated: number }>();

  function sweep(t: number) {
    // A bucket idle for a full window is full again, so dropping it loses nothing.
    for (const [key, b] of buckets) if (t - b.updated >= windowMs) buckets.delete(key);
  }

  return {
    check(key: string): RateLimitResult {
      const t = now();
      if (buckets.size > 1000) sweep(t);
      const b = buckets.get(key) ?? { tokens: capacity, updated: t };
      b.tokens = Math.min(capacity, b.tokens + (t - b.updated) * refillPerMs);
      b.updated = t;
      buckets.set(key, b);
      if (b.tokens >= 1) {
        b.tokens -= 1;
        return { ok: true, retryAfterSec: 0 };
      }
      return { ok: false, retryAfterSec: Math.max(1, Math.ceil((1 - b.tokens) / refillPerMs / 1000)) };
    },
    get size() {
      return buckets.size;
    },
  };
}

export type RateLimiter = ReturnType<typeof createRateLimiter>;
