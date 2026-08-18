import type { Role } from "@prisma/client";
import { AuthError, toErrorMessage } from "@/lib/errors";
import { getSessionUser, isManager } from "@/lib/authz";
import { logSecurity } from "@/lib/log";
import { rateLimit, type RateLimitPolicy } from "@/lib/rate-limit";

export { toErrorMessage };
export type ActionResult<T = unknown> = {
  ok: boolean;
  error?: string;
  data?: T;
};

export function ok<T>(data?: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(error: string): ActionResult<never> {
  return { ok: false, error };
}

export async function withUser(options?: { policy?: RateLimitPolicy; extra?: string }) {
  const user = await getSessionUser();
  if (!user) throw new AuthError("You must be signed in.");
  const policy = options?.policy ?? "action";
  const limited = await rateLimit(`${policy}:${user.id}:${options?.extra ?? ""}`, policy);
  if (!limited.ok) throw new AuthError("Too many requests. Try again shortly.", 429);
  return user;
}

export function ensureManager(role: Role) {
  if (!isManager(role)) {
    logSecurity("authz.denied", { reason: "manager_required" });
    throw new AuthError("Manager access required.", 403);
  }
}
