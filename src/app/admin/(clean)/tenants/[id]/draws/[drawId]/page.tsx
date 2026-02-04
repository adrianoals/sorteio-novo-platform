import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  tenants,
  draws,
  drawResults,
  apartments,
  parkingSpots,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { ViewDrawPageClient } from "./view-draw-page-client";

export default async function ViewDrawPage({
  params,
}: {
  params: Promise<{ id: string; drawId: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login?callbackUrl=/admin/tenants");
  }

  const { id: tenantId, drawId } = await params;
  const [tenant] = await db
    .select({ id: tenants.id, name: tenants.name, slug: tenants.slug })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  if (!tenant) notFound();

  const [draw] = await db
    .select()
    .from(draws)
    .where(and(eq(draws.id, drawId), eq(draws.tenantId, tenantId)))
    .limit(1);
  if (!draw) notFound();

  const results = await db
    .select({
      apartmentNumber: apartments.number,
      spotNumber: parkingSpots.number,
      spotBasement: parkingSpots.basement,
      spotType: parkingSpots.spotType,
      spotSpecialType: parkingSpots.specialType,
    })
    .from(drawResults)
    .innerJoin(apartments, eq(drawResults.apartmentId, apartments.id))
    .innerJoin(parkingSpots, eq(drawResults.spotId, parkingSpots.id))
    .where(eq(drawResults.drawId, drawId));

  return (
    <ViewDrawPageClient
      tenantId={tenant.id}
      tenantSlug={tenant.slug}
      drawId={draw.id}
      createdAt={String(draw.createdAt)}
      results={results}
    />
  );
}
