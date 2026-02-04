import { pgTable, uuid, varchar, jsonb } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { blocks } from "./blocks";
import { apartments } from "./apartments";

export const spotTypeEnum = ["simple", "double"] as const;
export type SpotType = (typeof spotTypeEnum)[number];

export const specialTypeEnum = ["normal", "pne", "idoso", "visitor"] as const;
export type SpecialType = (typeof specialTypeEnum)[number];

export interface ParkingSpotAttributes {
  [key: string]: unknown;
}

export const parkingSpots = pgTable("parking_spots", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  blockId: uuid("block_id").references(() => blocks.id, { onDelete: "set null" }),
  /** Se preenchido, a vaga está travada (atribuída) a este apartamento e não entra no sorteio. */
  apartmentId: uuid("apartment_id").references(() => apartments.id, { onDelete: "set null" }),
  number: varchar("number", { length: 50 }).notNull(),
  basement: varchar("basement", { length: 50 }),
  spotType: varchar("spot_type", { length: 20 }).notNull().default("simple"),
  specialType: varchar("special_type", { length: 20 }).default("normal"),
  attributes: jsonb("attributes").$type<ParkingSpotAttributes>(),
});
