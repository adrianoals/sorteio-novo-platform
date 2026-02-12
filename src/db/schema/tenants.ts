import { pgTable, uuid, varchar, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";

export const tenantStatusEnum = ["active", "inactive"] as const;
export type TenantStatus = (typeof tenantStatusEnum)[number];

export interface TenantConfig {
  has_blocks?: boolean;
  has_basement?: boolean;
  basements?: string[];
  enabled_features?: { pne?: boolean; idoso?: boolean };
  intended_draw_type?: "S1" | "S2" | "S3";
}

export interface TenantBranding {
  logo_url?: string;
  primary_color?: string;
}

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  config: jsonb("config").$type<TenantConfig>(),
  branding: jsonb("branding").$type<TenantBranding>(),
});
