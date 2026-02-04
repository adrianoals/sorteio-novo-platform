import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { apartments } from "./apartments";
import { parkingSpots } from "./parking_spots";

export const draws = pgTable("draws", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const drawResults = pgTable("draw_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  drawId: uuid("draw_id")
    .notNull()
    .references(() => draws.id, { onDelete: "cascade" }),
  apartmentId: uuid("apartment_id")
    .notNull()
    .references(() => apartments.id, { onDelete: "cascade" }),
  spotId: uuid("spot_id")
    .notNull()
    .references(() => parkingSpots.id, { onDelete: "cascade" }),
});
