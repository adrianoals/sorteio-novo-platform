import { db } from "@/db";
import {
  drawResults,
  apartments,
  parkingSpots,
} from "@/db/schema";
import { and, eq, isNotNull } from "drizzle-orm";

export type FullResultRow = {
  apartmentNumber: string;
  spotNumber: string;
  spotBasement: string | null;
  spotType: string;
  spotSpecialType: string | null;
};

/**
 * Retorna a lista completa de (apartamento, vaga) para um sorteio:
 * - Pares que saíram do sorteio (draw_results)
 * - Pares já atribuídos antes do sorteio (vagas travadas em parking_spots)
 * Ordenado por número do apartamento.
 */
export async function getFullDrawResults(
  tenantId: string,
  drawId: string
): Promise<FullResultRow[]> {
  const fromDrawRows = await db
    .select({
      apartmentId: apartments.id,
      apartmentNumber: apartments.number,
      spotNumber: parkingSpots.number,
      spotBasement: parkingSpots.basement,
      spotType: parkingSpots.spotType,
      spotSpecialType: parkingSpots.specialType,
    })
    .from(drawResults)
    .innerJoin(apartments, eq(drawResults.apartmentId, apartments.id))
    .innerJoin(parkingSpots, eq(drawResults.spotId, parkingSpots.id))
    .where(and(eq(drawResults.drawId, drawId), eq(drawResults.tenantId, tenantId)));

  const fromDraw: FullResultRow[] = fromDrawRows.map((r) => ({
    apartmentNumber: r.apartmentNumber,
    spotNumber: r.spotNumber,
    spotBasement: r.spotBasement,
    spotType: r.spotType,
    spotSpecialType: r.spotSpecialType,
  }));

  const drawnApartmentIds = new Set(fromDrawRows.map((r) => r.apartmentId));

  const preAssignedRows = await db
    .select({
      apartmentId: apartments.id,
      apartmentNumber: apartments.number,
      spotNumber: parkingSpots.number,
      spotBasement: parkingSpots.basement,
      spotType: parkingSpots.spotType,
      spotSpecialType: parkingSpots.specialType,
    })
    .from(parkingSpots)
    .innerJoin(apartments, eq(parkingSpots.apartmentId, apartments.id))
    .where(
      and(
        eq(parkingSpots.tenantId, tenantId),
        eq(apartments.tenantId, tenantId),
        isNotNull(parkingSpots.apartmentId)
      )
    );

  const preAssignedOnly: FullResultRow[] = preAssignedRows
    .filter((r) => !drawnApartmentIds.has(r.apartmentId))
    .map((r) => ({
      apartmentNumber: r.apartmentNumber,
      spotNumber: r.spotNumber,
      spotBasement: r.spotBasement,
      spotType: r.spotType,
      spotSpecialType: r.spotSpecialType,
    }));

  const combined: FullResultRow[] = [...fromDraw, ...preAssignedOnly];
  combined.sort((a, b) =>
    String(a.apartmentNumber).localeCompare(String(b.apartmentNumber), "pt-BR", {
      numeric: true,
    })
  );
  return combined;
}
