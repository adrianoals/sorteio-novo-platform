import { pgTable, uuid, timestamp, varchar, foreignKey, unique } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { apartments } from "./apartments";
import { parkingSpots } from "./parking_spots";
import { users } from "./users";

export const draws = pgTable(
  "draws",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    randomSeed: varchar("random_seed", { length: 128 }),
    executedByUserId: uuid("executed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (t) => [unique("draws_id_tenant_unique").on(t.id, t.tenantId)]
);

export const drawResults = pgTable(
  "draw_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    drawId: uuid("draw_id")
      .notNull()
      .references(() => draws.id, { onDelete: "cascade" }),
    apartmentId: uuid("apartment_id")
      .notNull()
      .references(() => apartments.id, { onDelete: "cascade" }),
    spotId: uuid("spot_id")
      .notNull()
      .references(() => parkingSpots.id, { onDelete: "cascade" }),
  },
  (t) => [
    foreignKey({
      columns: [t.drawId, t.tenantId],
      foreignColumns: [draws.id, draws.tenantId],
      name: "draw_results_draw_tenant_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.apartmentId, t.tenantId],
      foreignColumns: [apartments.id, apartments.tenantId],
      name: "draw_results_apartment_tenant_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.spotId, t.tenantId],
      foreignColumns: [parkingSpots.id, parkingSpots.tenantId],
      name: "draw_results_spot_tenant_fk",
    }).onDelete("cascade"),
  ]
);
