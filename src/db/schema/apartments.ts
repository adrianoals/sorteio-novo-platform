import { pgTable, uuid, varchar, jsonb } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { blocks } from "./blocks";

export const apartmentRightsEnum = [
  "simple",
  "double",
  "two_simple",
  "car",
  "moto",
] as const;
export type ApartmentRights = (typeof apartmentRightsEnum)[number];

export interface ApartmentAttributes {
  [key: string]: unknown;
}

export const apartments = pgTable("apartments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  blockId: uuid("block_id").references(() => blocks.id, { onDelete: "set null" }),
  number: varchar("number", { length: 50 }).notNull(),
  rights: varchar("rights", { length: 50 }).notNull().default("simple"),
  attributes: jsonb("attributes").$type<ApartmentAttributes>(),
});
