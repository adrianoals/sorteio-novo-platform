import { db } from "@/db";
import {
  apartments,
  parkingSpots,
  type ApartmentRightsList,
} from "@/db/schema";
import { eq, isNull } from "drizzle-orm";

export type DrawSlotType = "simple" | "double";

export interface DrawAssignment {
  apartmentId: string;
  spotId: string;
}

export interface RunDrawS1Result {
  results: DrawAssignment[];
}

/**
 * Expande rights em lista de tipos de slot: simple -> 1 slot, double -> 1, two_simple -> 2 slots simples.
 */
function expandRightsToSlotTypes(rights: ApartmentRightsList): DrawSlotType[] {
  const out: DrawSlotType[] = [];
  for (const r of rights) {
    if (r === "simple" || r === "car" || r === "moto") out.push("simple");
    else if (r === "double") out.push("double");
    else if (r === "two_simple") {
      out.push("simple");
      out.push("simple");
    }
  }
  return out;
}

/**
 * Verifica se a vaga é elegível para o apartamento (tipo + restrições de subsolo/bloco).
 */
function spotEligibleForApartment(
  spot: { spotType: string; basement: string | null; blockId: string | null },
  slotType: DrawSlotType,
  apt: {
    allowedSubsolos: string[] | null;
    allowedBlocks: string[] | null;
  }
): boolean {
  if (spot.spotType !== slotType) return false;
  if (apt.allowedSubsolos && apt.allowedSubsolos.length > 0) {
    const basement = spot.basement ?? "";
    if (!apt.allowedSubsolos.includes(basement)) return false;
  }
  if (apt.allowedBlocks && apt.allowedBlocks.length > 0) {
    const blockId = spot.blockId ?? "";
    if (!apt.allowedBlocks.includes(blockId)) return false;
  }
  return true;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Motor S1: sorteio simples em lote.
 * Usa apenas vagas não travadas (apartment_id nulo) e demanda pendente por apartamento
 * (direitos menos vagas já atribuídas a ele). Não persiste; retorna apenas os pares (apartmentId, spotId).
 */
export async function runDrawS1(tenantId: string): Promise<RunDrawS1Result> {
  const aptList = await db
    .select({
      id: apartments.id,
      rights: apartments.rights,
      allowedSubsolos: apartments.allowedSubsolos,
      allowedBlocks: apartments.allowedBlocks,
    })
    .from(apartments)
    .where(eq(apartments.tenantId, tenantId));

  const allSpots = await db
    .select({
      id: parkingSpots.id,
      spotType: parkingSpots.spotType,
      basement: parkingSpots.basement,
      blockId: parkingSpots.blockId,
      apartmentId: parkingSpots.apartmentId,
    })
    .from(parkingSpots)
    .where(eq(parkingSpots.tenantId, tenantId));

  const availableSpots = allSpots.filter((s) => s.apartmentId == null);
  const assignedByApartment = new Map<string, number>();
  for (const s of allSpots) {
    if (s.apartmentId) {
      assignedByApartment.set(
        s.apartmentId,
        (assignedByApartment.get(s.apartmentId) ?? 0) + 1
      );
    }
  }

  type AptRestrictions = {
    allowedSubsolos: string[] | null;
    allowedBlocks: string[] | null;
  };
  type PendingSlot = { apartmentId: string; slotType: DrawSlotType; apt: AptRestrictions };
  const pendingSlots: PendingSlot[] = [];

  for (const apt of aptList) {
    const rights = (apt.rights ?? []) as ApartmentRightsList;
    const slotTypes = expandRightsToSlotTypes(rights);
    const filled = assignedByApartment.get(apt.id) ?? 0;
    const remaining = slotTypes.slice(filled);
    const aptRestrictions: AptRestrictions = {
      allowedSubsolos: apt.allowedSubsolos ?? null,
      allowedBlocks: apt.allowedBlocks ?? null,
    };
    for (const st of remaining) {
      pendingSlots.push({
        apartmentId: apt.id,
        slotType: st,
        apt: aptRestrictions,
      });
    }
  }

  const shuffledSlots = shuffle(pendingSlots);
  const spotPool = shuffle(availableSpots);
  const usedSpotIds = new Set<string>();
  const results: DrawAssignment[] = [];

  for (const slot of shuffledSlots) {
    const found = spotPool.find(
      (s) =>
        !usedSpotIds.has(s.id) &&
        spotEligibleForApartment(s, slot.slotType, slot.apt)
    );
    if (found) {
      usedSpotIds.add(found.id);
      results.push({ apartmentId: slot.apartmentId, spotId: found.id });
    }
  }

  return { results };
}
