import { logSecurity } from "@/lib/log";

type Bucket = { count: number; resetAt: number };

export const RATE_LIMIT_POLICIES = {
  auth: { limit: 8, windowMs: 15 * 60_000 },
  billing: { limit: 15, windowMs: 60_000 },
  webhook: { limit: 180, windowMs: 60_000 },
  ai: { limit: 8, windowMs: 60_000 },
  search: { limit: 30, windowMs: 60_000 },
  ingest: { limit: 40, windowMs: 60_000 },
  chat: { limit: 20, windowMs: 60_000 },
  api: { limit: 90, windowMs: 60_000 },
  upload: { limit: 8, windowMs: 10 * 60_000 },
  cron: { limit: 20, windowMs: 60_000 },
  action: { limit: 120, windowMs: 60_000 },
} as const;

export type RateLimitPolicy = keyof typeof RATE_LIMIT_POLICIES;

export type RateLimitResult = { ok: boolean; remaining: number; resetAt: number };

const memory = new Map<string, Bucket>();

function policyConfig(policy: RateLimitPolicy | number, windowMs?: number) {
  if (typeof policy === "number") {
    return { limit: policy, windowMs: windowMs ?? 60_000 };
  }
  return RATE_LIMIT_POLICIES[policy];
}

export async function rateLimit(
  key: string,
  policy: RateLimitPolicy | number = "api",
  windowMs?: number,
): Promise<RateLimitResult> {
  const { limit, windowMs: window } = policyConfig(policy, windowMs);
  const now = Date.now();
  const current = (await readBucket(key)) ?? { count: 0, resetAt: now + window };
  if (current.resetAt <= now) {
    const fresh = { count: 1, resetAt: now + window };
    await writeBucket(key, fresh, window);
    return { ok: true, remaining: limit - 1, resetAt: fresh.resetAt };
  }
  if (current.count >= limit) {
    logSecurity("rate_limit", { key: key.split(":")[0], remaining: 0 });
    return { ok: false, remaining: 0, resetAt: current.resetAt };
  }
  const next = { ...current, count: current.count + 1 };
  await writeBucket(key, next, current.resetAt - now);
  return { ok: true, remaining: Math.max(0, limit - next.count), resetAt: next.resetAt };
}

export function clientKey(request: Request, scope: string) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  return `${scope}:${ip}`;
}

export function retryAfterSeconds(result: RateLimitResult) {
  return Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
}

async function readBucket(key: string): Promise<Bucket | undefined> {
  if (process.env.VERCEL && process.env.VITEST !== "true") {
    try {
      const { getCache } = await import("@vercel/functions");
      const cached = await getCache({ namespace: "revivelead-rl" }).get(key);
      if (cached && typeof cached === "object" && "count" in cached && "resetAt" in cached) {
        return cached as Bucket;
      }
    } catch {
      /* use memory */
    }
  }
  return memory.get(key);
}

async function writeBucket(key: string, bucket: Bucket, ttlMs: number) {
  memory.set(key, bucket);
  if (process.env.VERCEL && process.env.VITEST !== "true") {
    try {
      const { getCache } = await import("@vercel/functions");
      await getCache({ namespace: "revivelead-rl" }).set(key, bucket, {
        ttl: Math.max(1, Math.ceil(ttlMs / 1000)),
        name: "rate-limit",
      });
    } catch {
      /* memory already set */
    }
  }
}
