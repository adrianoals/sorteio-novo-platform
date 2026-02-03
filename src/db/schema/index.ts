export * from "./tenants";
export * from "./blocks";
export * from "./apartments";
export * from "./parking_spots";
export * from "./audit_logs";

import { relations } from "drizzle-orm";
import { tenants } from "./tenants";
import { blocks } from "./blocks";
import { apartments } from "./apartments";
import { parkingSpots } from "./parking_spots";
import { auditLogs } from "./audit_logs";

export const tenantsRelations = relations(tenants, ({ many }) => ({
  blocks: many(blocks),
  apartments: many(apartments),
  parkingSpots: many(parkingSpots),
  auditLogs: many(auditLogs),
}));

export const blocksRelations = relations(blocks, ({ one, many }) => ({
  tenant: one(tenants),
  apartments: many(apartments),
  parkingSpots: many(parkingSpots),
}));

export const apartmentsRelations = relations(apartments, ({ one }) => ({
  tenant: one(tenants),
  block: one(blocks),
}));

export const parkingSpotsRelations = relations(parkingSpots, ({ one }) => ({
  tenant: one(tenants),
  block: one(blocks),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants),
}));
