import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import type { AuditPayload } from "@/db/schema/audit_logs";

export async function logAudit(
  actorUserId: string,
  action: "create" | "update" | "delete" | "import",
  entityType: "tenant" | "apartment" | "spot" | "block" | "draw",
  entityId: string,
  tenantId?: string | null,
  payload?: AuditPayload
) {
  await db.insert(auditLogs).values({
    actorUserId,
    action,
    entityType,
    entityId,
    tenantId: tenantId ?? null,
    payload: payload ?? null,
  });
}
