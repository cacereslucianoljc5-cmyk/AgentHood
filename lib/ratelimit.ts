// Simple in-memory daily rate limiter, keyed by client IP.
// Note: Vercel serverless functions are ephemeral, so this resets on cold
// starts and is per-instance. It's a lightweight "good enough" backstop for a
// free tier. For strict, persistent limits, swap this for Upstash Redis or a
// Neon Postgres counter (see README).

type Bucket = { count: number; day: string };

const store = new Map<string, Bucket>();

// Daily limits per feature (also mirrored in the client UI).
export const LIMITS = {
  image: 20,
} as const;

export type Feature = keyof typeof LIMITS;

function today(): string {
  // UTC day boundary.
  return new Date().toISOString().slice(0, 10);
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "anonymous";
}

export type RateResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
};

export function checkAndConsume(ip: string, feature: Feature): RateResult {
  const limit = LIMITS[feature];
  const key = `${feature}:${ip}`;
  const day = today();
  const bucket = store.get(key);

  if (!bucket || bucket.day !== day) {
    store.set(key, { count: 1, day });
    return { allowed: true, remaining: limit - 1, limit };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, limit };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, limit };
}
