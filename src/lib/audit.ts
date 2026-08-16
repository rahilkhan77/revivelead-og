import { db } from "@/lib/db";

export async function writeAudit(input: {
  organizationId: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await db.auditLog.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId ?? undefined,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? undefined,
      metadata: JSON.stringify(input.metadata ?? {}),
    },
  });
}
