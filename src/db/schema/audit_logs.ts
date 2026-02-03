import { pgTable, uuid, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const auditActionEnum = [
  "create",
  "update",
  "delete",
  "import",
] as const;
export type AuditAction = (typeof auditActionEnum)[number];

export const auditEntityTypeEnum = [
  "tenant",
  "apartment",
  "spot",
  "block",
] as const;
export type AuditEntityType = (typeof auditEntityTypeEnum)[number];

export interface AuditPayload {
  [key: string]: unknown;
}

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: varchar("actor_user_id", { length: 255 }),
  action: varchar("action", { length: 50 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: varchar("entity_id", { length: 255 }).notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id, {
    onDelete: "set null",
  }),
  payload: jsonb("payload").$type<AuditPayload>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
