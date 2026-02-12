ALTER TABLE "draw_results" ADD COLUMN "tenant_id" uuid;--> statement-breakpoint
ALTER TABLE "draws" ADD COLUMN "random_seed" varchar(128);--> statement-breakpoint
UPDATE "draw_results" dr
SET "tenant_id" = d."tenant_id"
FROM "draws" d
WHERE dr."draw_id" = d."id";--> statement-breakpoint
ALTER TABLE "apartments" ADD CONSTRAINT "apartments_id_tenant_unique" UNIQUE("id","tenant_id");--> statement-breakpoint
ALTER TABLE "parking_spots" ADD CONSTRAINT "parking_spots_id_tenant_unique" UNIQUE("id","tenant_id");--> statement-breakpoint
ALTER TABLE "draws" ADD CONSTRAINT "draws_id_tenant_unique" UNIQUE("id","tenant_id");--> statement-breakpoint
ALTER TABLE "draw_results" ALTER COLUMN "tenant_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "draw_results" ADD CONSTRAINT "draw_results_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draw_results" ADD CONSTRAINT "draw_results_draw_tenant_fk" FOREIGN KEY ("draw_id","tenant_id") REFERENCES "public"."draws"("id","tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draw_results" ADD CONSTRAINT "draw_results_apartment_tenant_fk" FOREIGN KEY ("apartment_id","tenant_id") REFERENCES "public"."apartments"("id","tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draw_results" ADD CONSTRAINT "draw_results_spot_tenant_fk" FOREIGN KEY ("spot_id","tenant_id") REFERENCES "public"."parking_spots"("id","tenant_id") ON DELETE cascade ON UPDATE no action;
