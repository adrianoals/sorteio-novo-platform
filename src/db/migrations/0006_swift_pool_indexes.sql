CREATE INDEX IF NOT EXISTS "blocks_tenant_id_idx" ON "blocks" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "apartments_tenant_id_idx" ON "apartments" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "apartments_tenant_number_block_idx" ON "apartments" ("tenant_id","number","block_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "parking_spots_tenant_id_idx" ON "parking_spots" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "parking_spots_tenant_number_loc_idx" ON "parking_spots" ("tenant_id","number","basement","block_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "parking_spots_tenant_apartment_idx" ON "parking_spots" ("tenant_id","apartment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "draws_tenant_created_at_idx" ON "draws" ("tenant_id","created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "draw_results_tenant_draw_idx" ON "draw_results" ("tenant_id","draw_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "draw_results_tenant_apartment_idx" ON "draw_results" ("tenant_id","apartment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "draw_results_tenant_spot_idx" ON "draw_results" ("tenant_id","spot_id");
