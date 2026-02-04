export * from "./tenants";
export * from "./blocks";
export * from "./apartments";
export * from "./parking_spots";
export * from "./audit_logs";
export * from "./users";
export * from "./draws";

import { relations } from "drizzle-orm";
import { tenants } from "./tenants";
import { blocks } from "./blocks";
import { apartments } from "./apartments";
import { parkingSpots } from "./parking_spots";
import { auditLogs } from "./audit_logs";
import { draws, drawResults } from "./draws";

export const tenantsRelations = relations(tenants, ({ many }) => ({
  blocks: many(blocks),
  apartments: many(apartments),
  parkingSpots: many(parkingSpots),
  auditLogs: many(auditLogs),
  draws: many(draws),
}));

export const blocksRelations = relations(blocks, ({ one, many }) => ({
  tenant: one(tenants),
  apartments: many(apartments),
  parkingSpots: many(parkingSpots),
}));

export const apartmentsRelations = relations(apartments, ({ one, many }) => ({
  tenant: one(tenants),
  block: one(blocks),
  assignedSpots: many(parkingSpots),
}));

export const parkingSpotsRelations = relations(parkingSpots, ({ one }) => ({
  tenant: one(tenants),
  block: one(blocks),
  apartment: one(apartments),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants),
}));

export const drawsRelations = relations(draws, ({ one, many }) => ({
  tenant: one(tenants),
  results: many(drawResults),
}));

export const drawResultsRelations = relations(drawResults, ({ one }) => ({
  draw: one(draws),
  apartment: one(apartments),
  spot: one(parkingSpots),
}));
