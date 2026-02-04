-- Drop default so we can change type; convert varchar to jsonb array (e.g. 'simple' -> ['simple'])
ALTER TABLE "apartments" ALTER COLUMN "rights" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "apartments" ALTER COLUMN "rights" TYPE jsonb USING jsonb_build_array(COALESCE("rights", 'simple'));--> statement-breakpoint
ALTER TABLE "apartments" ALTER COLUMN "rights" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "apartments" ADD COLUMN "allowed_subsolos" jsonb;--> statement-breakpoint
ALTER TABLE "apartments" ADD COLUMN "allowed_blocks" jsonb;--> statement-breakpoint
ALTER TABLE "parking_spots" ADD COLUMN "apartment_id" uuid;--> statement-breakpoint
ALTER TABLE "parking_spots" ADD CONSTRAINT "parking_spots_apartment_id_apartments_id_fk" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE set null ON UPDATE no action;