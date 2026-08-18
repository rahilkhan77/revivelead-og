import { timingSafeEqual } from "crypto";
import type { IntegrationType } from "@prisma/client";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/format";

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function resolveOrgFromSecret(
  secret: string | null | undefined,
  types: IntegrationType[],
) {
  if (!secret) return null;
  const integrations = await db.integration.findMany({
    where: { type: { in: types }, enabled: true },
  });
  for (const item of integrations) {
    const config = parseJson<{ secret?: string; webhookSecret?: string }>(item.config, {});
    const stored = config.webhookSecret || config.secret;
    if (stored && safeEqual(stored, secret)) {
      return item.organizationId;
    }
  }
  return null;
}

export function cronAuthorized(
  expected: string | undefined,
  provided: string,
  nodeEnv = process.env.NODE_ENV,
) {
  if (!expected) {
    return nodeEnv !== "production";
  }
  return safeEqual(expected, provided);
}

export function requireCronSecret(request: Request) {
  const expected = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  return cronAuthorized(expected, provided);
}

export async function assertMemberInOrganization(organizationId: string, userId: string) {
  const membership = await db.membership.findFirst({
    where: { organizationId, userId },
  });
  if (!membership) {
    throw new Error("That teammate does not belong to this organization.");
  }
  return membership;
}
