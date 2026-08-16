import { AuthError, getSessionUser, isManager } from "@/lib/authz";
import type { Role } from "@prisma/client";

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

export async function withUser() {
  const user = await getSessionUser();
  if (!user) throw new AuthError("You must be signed in.");
  return user;
}

export function ensureManager(role: Role) {
  if (!isManager(role)) throw new AuthError("Manager access required.", 403);
}

export function toErrorMessage(error: unknown) {
  if (error instanceof AuthError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}
