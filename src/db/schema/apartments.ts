import { pgTable, uuid, varchar, jsonb } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { blocks } from "./blocks";

export const apartmentRightsEnum = [
  "simple",
  "double",
  "two_simple",
  "moto",
] as const;
export type ApartmentRights = (typeof apartmentRightsEnum)[number];

export interface ApartmentAttributes {
  [key: string]: unknown;
}

/** Lista de direitos: cada tipo pode repetir (ex.: ["simple","simple","double"] = 2 simples + 1 dupla). */
export type ApartmentRightsList = ApartmentRights[];

export const apartments = pgTable("apartments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  blockId: uuid("block_id").references(() => blocks.id, { onDelete: "set null" }),
  number: varchar("number", { length: 50 }).notNull(),
  /** Lista de tipos de vaga que o apartamento pode pleitear (repetição = quantidade). */
  rights: jsonb("rights").$type<ApartmentRightsList>().notNull().default([]),
  /** Subsolos em que pode concorrer; vazio = qualquer. */
  allowedSubsolos: jsonb("allowed_subsolos").$type<string[]>(),
  /** IDs de blocos em que pode concorrer; vazio = qualquer. */
  allowedBlocks: jsonb("allowed_blocks").$type<string[]>(),
  attributes: jsonb("attributes").$type<ApartmentAttributes>(),
});
