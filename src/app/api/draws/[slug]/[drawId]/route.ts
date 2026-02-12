import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  tenants,
  draws,
  drawResults,
  apartments,
  parkingSpots,
} from "@/db/schema";
import { and, eq, asc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; drawId: string }> }
) {
  const { slug, drawId } = await params;

  const [tenant] = await db
    .select({ id: tenants.id, name: tenants.name })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  if (!tenant) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const [draw] = await db
    .select({ id: draws.id, createdAt: draws.createdAt })
    .from(draws)
    .where(and(eq(draws.id, drawId), eq(draws.tenantId, tenant.id)))
    .limit(1);

  if (!draw) {
    return NextResponse.json({ error: "Sorteio não encontrado" }, { status: 404 });
  }

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
    .where(and(eq(drawResults.drawId, drawId), eq(drawResults.tenantId, tenant.id)))
    .orderBy(asc(apartments.number));

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

  const createdAt = new Date(draw.createdAt);
  const formattedDate = createdAt.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return NextResponse.json({
    tenantName: tenant.name,
    drawId: draw.id,
    createdAt: draw.createdAt,
    createdAtFormatted: formattedDate,
    results: results.map((r) => ({
      apartmentNumber: r.apartmentNumber,
      apartmentId: r.apartmentId,
      spotNumber: r.spotNumber,
      spotBasement: r.spotBasement ?? "",
      spotTypeLabel: SPOT_TYPE_LABELS[r.spotType] ?? r.spotType,
      spotSpecialLabel: SPECIAL_LABELS[r.spotSpecialType ?? "normal"] ?? r.spotSpecialType,
    })),
  });
}
