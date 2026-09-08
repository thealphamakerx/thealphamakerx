// In-memory fixed-window limiter. Good enough for a single long-lived
// server process; on serverless (each invocation can be a fresh instance)
// this only limits bursts within a warm instance, not globally across all
// of them — a real deployment under abuse needs a shared store (e.g. Neon
// itself, or Redis/Upstash), not this. Kept intentionally simple until
// abuse is an actual observed problem, per this project's "don't build
// speculative infra" rule.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, { windowMs, max }: { windowMs: number; max: number }) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true as const };
  }

  if (bucket.count >= max) {
    return { allowed: false as const, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true as const };
}

export function getClientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
