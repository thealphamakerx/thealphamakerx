import { db } from "@/lib/db";

export async function logAudit({
  actorUserId,
  action,
  entityType,
  entityId,
  before,
  after,
}: {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
}) {
  await db.orm.public.AuditLog.create({
    actorUserId,
    action,
    entityType,
    entityId,
    beforeValue: before !== undefined ? JSON.stringify(before) : undefined,
    afterValue: after !== undefined ? JSON.stringify(after) : undefined,
  });
}
