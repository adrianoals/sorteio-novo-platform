import { db } from "@/db";
import {
  tenants,
  draws,
  drawResults,
  apartments,
  parkingSpots,
} from "@/db/schema";
import { and, eq, asc } from "drizzle-orm";

const SPOT_TYPE_LABELS: Record<string, string> = {
  simple: "Simples",
  double: "Dupla",
};
const SPECIAL_LABELS: Record<string, string> = {
  normal: "Normal",
  pne: "PNE",
  idoso: "Idoso",
  visitor: "Visitante",
};

export type PublicDrawResult = {
  tenantName: string;
  drawId: string;
  createdAt: string;
  createdAtFormatted: string;
  results: {
    apartmentNumber: string;
    apartmentId: string;
    spotNumber: string;
    spotBasement: string;
    spotTypeLabel: string;
    spotSpecialLabel: string;
  }[];
};

export async function getPublicDrawBySlugAndId(
  slug: string,
  drawId: string
): Promise<PublicDrawResult | null> {
  const [tenant] = await db
    .select({ id: tenants.id, name: tenants.name })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  if (!tenant) return null;

  const [draw] = await db
    .select({ id: draws.id, createdAt: draws.createdAt })
    .from(draws)
    .where(and(eq(draws.id, drawId), eq(draws.tenantId, tenant.id)))
    .limit(1);

  if (!draw) return null;

  const results = await db
    .select({
      apartmentNumber: apartments.number,
      apartmentId: apartments.id,
      spotNumber: parkingSpots.number,
      spotBasement: parkingSpots.basement,
      spotType: parkingSpots.spotType,
      spotSpecialType: parkingSpots.specialType,
    })
    .from(drawResults)
    .innerJoin(apartments, eq(drawResults.apartmentId, apartments.id))
    .innerJoin(parkingSpots, eq(drawResults.spotId, parkingSpots.id))
    .where(eq(drawResults.drawId, drawId))
    .orderBy(asc(apartments.number));

  const createdAt = new Date(draw.createdAt);
  const formattedDate = createdAt.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    tenantName: tenant.name,
    drawId: draw.id,
    createdAt:
      draw.createdAt instanceof Date
        ? draw.createdAt.toISOString()
        : String(draw.createdAt),
    createdAtFormatted: formattedDate,
    results: results.map((r) => ({
      apartmentNumber: r.apartmentNumber,
      apartmentId: r.apartmentId,
      spotNumber: r.spotNumber,
      spotBasement: r.spotBasement ?? "",
      spotTypeLabel: SPOT_TYPE_LABELS[r.spotType] ?? r.spotType,
      spotSpecialLabel:
        SPECIAL_LABELS[r.spotSpecialType ?? "normal"] ?? r.spotSpecialType ?? "",
    })),
  };
}
