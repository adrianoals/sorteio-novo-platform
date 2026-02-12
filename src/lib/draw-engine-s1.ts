import { db } from "@/db";
import {
  apartments,
  parkingSpots,
  type ApartmentRightsList,
} from "@/db/schema";
import { eq } from "drizzle-orm";

export type DrawSlotType = "simple" | "double";

export interface DrawAssignment {
  apartmentId: string;
  spotId: string;
}

export interface RunDrawS1Result {
  results: DrawAssignment[];
}

type DrawDbExecutor = Pick<typeof db, "select">;

/**
 * Expande rights em lista de tipos de slot: simple -> 1 slot, double -> 1, two_simple -> 2 slots simples.
 */
function expandRightsToSlotTypes(rights: ApartmentRightsList): DrawSlotType[] {
  const out: DrawSlotType[] = [];
  for (const r of rights) {
    const right = r as string;
    if (right === "simple" || right === "moto" || right === "car") out.push("simple"); // "car" legado: tratar como simples
    else if (right === "double") out.push("double");
    else if (right === "two_simple") {
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

function xmur3(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createSeededRandom(seed: string): () => number {
  const seedGen = xmur3(seed);
  return mulberry32(seedGen());
}

function shuffleWithRng<T>(arr: T[], random: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

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

  const random = options?.seed ? createSeededRandom(options.seed) : Math.random;
  const shuffledSlots = shuffleWithRng(pendingSlots, random);
  const spotPool = shuffleWithRng(availableSpots, random);
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
