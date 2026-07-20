import { db } from "@/db";
import {
  drawResults,
  apartments,
  parkingSpots,
  blocks,
} from "@/db/schema";
import { and, eq, isNotNull } from "drizzle-orm";
import { formatParkingUnitLabel } from "./parking-units";
import { compareDrawResults } from "./draw-result-order";

export type FullResultRow = {
  apartmentNumber: string;
  blockName: string | null;
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
  const [fromDrawRows, preAssignedRows] = await Promise.all([
    db
      .select({
        apartmentId: apartments.id,
        apartmentNumber: apartments.number,
        blockName: blocks.name,
        spotNumber: parkingSpots.number,
        spotBasement: parkingSpots.basement,
        spotType: parkingSpots.spotType,
        spotSpecialType: parkingSpots.specialType,
        allocationType: parkingSpots.allocationType,
        physicalSpots: parkingSpots.physicalSpots,
      })
      .from(drawResults)
      .innerJoin(apartments, eq(drawResults.apartmentId, apartments.id))
      .innerJoin(parkingSpots, eq(drawResults.spotId, parkingSpots.id))
      .leftJoin(blocks, eq(apartments.blockId, blocks.id))
      .where(and(eq(drawResults.drawId, drawId), eq(drawResults.tenantId, tenantId))),
    db
      .select({
        apartmentId: apartments.id,
        apartmentNumber: apartments.number,
        blockName: blocks.name,
        spotNumber: parkingSpots.number,
        spotBasement: parkingSpots.basement,
        spotType: parkingSpots.spotType,
        spotSpecialType: parkingSpots.specialType,
        allocationType: parkingSpots.allocationType,
        physicalSpots: parkingSpots.physicalSpots,
      })
      .from(parkingSpots)
      .innerJoin(apartments, eq(parkingSpots.apartmentId, apartments.id))
      .leftJoin(blocks, eq(apartments.blockId, blocks.id))
      .where(
        and(
          eq(parkingSpots.tenantId, tenantId),
          eq(apartments.tenantId, tenantId),
          isNotNull(parkingSpots.apartmentId)
        )
      ),
  ]);

  const drawnApartmentIds = new Set(fromDrawRows.map((r) => r.apartmentId));

  const fromDraw: FullResultRow[] = fromDrawRows.map((r) => ({
    apartmentNumber: r.apartmentNumber,
    blockName: r.blockName,
    spotNumber: formatParkingUnitLabel(r.spotNumber, r.allocationType, r.physicalSpots),
    spotBasement: r.spotBasement,
    spotType: r.spotType,
    spotSpecialType: r.spotSpecialType,
  }));

  const preAssignedOnly: FullResultRow[] = preAssignedRows
    .filter((r) => !drawnApartmentIds.has(r.apartmentId))
    .map((r) => ({
      apartmentNumber: r.apartmentNumber,
      blockName: r.blockName,
      spotNumber: formatParkingUnitLabel(r.spotNumber, r.allocationType, r.physicalSpots),
      spotBasement: r.spotBasement,
      spotType: r.spotType,
      spotSpecialType: r.spotSpecialType,
    }));

  const combined: FullResultRow[] = [...fromDraw, ...preAssignedOnly];
  combined.sort(compareDrawResults);
  return combined;
}
