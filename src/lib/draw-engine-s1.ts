import { db } from "@/db";
import {
  apartments,
  parkingSpots,
  type ApartmentRightsList,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { calculateDrawAssignments } from "@/lib/draw-engine-s1-core";

export type { DrawSlotType } from "@/lib/draw-rights";

export interface DrawAssignment {
  apartmentId: string;
  spotId: string;
}

export interface RunDrawS1Result {
  results: DrawAssignment[];
}

type DrawDbExecutor = Pick<typeof db, "select">;

/**
 * Motor S1: sorteio simples em lote.
 * Usa apenas vagas não travadas (apartment_id nulo) e demanda pendente por apartamento
 * (direitos menos vagas já atribuídas a ele). Não persiste; retorna apenas os pares (apartmentId, spotId).
 */
export async function runDrawS1(
  tenantId: string,
  options?: { seed?: string; executor?: DrawDbExecutor }
): Promise<RunDrawS1Result> {
  const executor = options?.executor ?? db;

  const aptList = await executor
    .select({
      id: apartments.id,
      rights: apartments.rights,
      allowedSubsolos: apartments.allowedSubsolos,
      allowedBlocks: apartments.allowedBlocks,
      attributes: apartments.attributes,
    })
    .from(apartments)
    .where(eq(apartments.tenantId, tenantId));

  const allSpots = await executor
    .select({
      id: parkingSpots.id,
      spotType: parkingSpots.spotType,
      basement: parkingSpots.basement,
      blockId: parkingSpots.blockId,
      apartmentId: parkingSpots.apartmentId,
      specialType: parkingSpots.specialType,
    })
    .from(parkingSpots)
    .where(eq(parkingSpots.tenantId, tenantId));

  const seed = options?.seed ?? randomUUID();
  const results = calculateDrawAssignments(
    aptList.map((apartment) => ({
      ...apartment,
      rights: (apartment.rights ?? []) as ApartmentRightsList,
      allowedSubsolos: apartment.allowedSubsolos ?? null,
      allowedBlocks: apartment.allowedBlocks ?? null,
      specialEligibility: Array.isArray(
        (apartment.attributes as { specialEligibility?: unknown } | null)
          ?.specialEligibility
      )
        ? (
            apartment.attributes as { specialEligibility: string[] }
          ).specialEligibility
        : [],
    })),
    allSpots,
    seed
  );

  return { results };
}
