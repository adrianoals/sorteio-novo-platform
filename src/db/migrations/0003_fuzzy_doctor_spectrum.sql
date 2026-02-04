CREATE TABLE "draw_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"draw_id" uuid NOT NULL,
	"apartment_id" uuid NOT NULL,
	"spot_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "draws" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "draw_results" ADD CONSTRAINT "draw_results_draw_id_draws_id_fk" FOREIGN KEY ("draw_id") REFERENCES "public"."draws"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draw_results" ADD CONSTRAINT "draw_results_apartment_id_apartments_id_fk" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draw_results" ADD CONSTRAINT "draw_results_spot_id_parking_spots_id_fk" FOREIGN KEY ("spot_id") REFERENCES "public"."parking_spots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draws" ADD CONSTRAINT "draws_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;