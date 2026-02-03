import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const blocks = pgTable("blocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 50 }),
});
