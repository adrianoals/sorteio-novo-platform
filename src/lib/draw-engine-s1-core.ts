import type { ApartmentRightsList } from "@/db/schema";
import { getRemainingSlotTypes, type DrawSlotType } from "@/lib/draw-rights";

export interface DrawApartment {
  id: string;
  rights: ApartmentRightsList;
  allowedSubsolos: string[] | null;
  allowedBlocks: string[] | null;
}

export interface DrawSpot {
  id: string;
  spotType: string;
  basement: string | null;
  blockId: string | null;
  apartmentId: string | null;
}

export interface DrawAssignment {
  apartmentId: string;
  spotId: string;
}

function spotEligibleForApartment(
  spot: DrawSpot,
  slotType: DrawSlotType,
  apartment: Pick<DrawApartment, "allowedSubsolos" | "allowedBlocks">
): boolean {
  if (spot.spotType !== slotType) return false;
  if (
    apartment.allowedSubsolos?.length &&
    !apartment.allowedSubsolos.includes(spot.basement ?? "")
  ) {
    return false;
  }
  if (
    apartment.allowedBlocks?.length &&
    !apartment.allowedBlocks.includes(spot.blockId ?? "")
  ) {
    return false;
  }
  return true;
}

function xmur3(seed: string) {
  let hash = 1779033703 ^ seed.length;
  for (let index = 0; index < seed.length; index++) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    return (hash ^= hash >>> 16) >>> 0;
  };
}

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createSeededRandom(seed: string): () => number {
  return mulberry32(xmur3(seed)());
}

function shuffleWithRng<T>(items: T[], random: () => number): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

/** Executa o matching S1 sem acessar banco ou produzir efeitos colaterais. */
export function calculateDrawAssignments(
  apartments: readonly DrawApartment[],
  spots: readonly DrawSpot[],
  seed: string
): DrawAssignment[] {
  const availableSpots = spots.filter((spot) => spot.apartmentId == null);
  const assignedTypesByApartment = new Map<string, string[]>();

  for (const spot of spots) {
    if (!spot.apartmentId) continue;
    const assignedTypes = assignedTypesByApartment.get(spot.apartmentId) ?? [];
    assignedTypes.push(spot.spotType);
    assignedTypesByApartment.set(spot.apartmentId, assignedTypes);
  }

  const pendingSlots = apartments.flatMap((apartment) =>
    getRemainingSlotTypes(
      apartment.rights,
      assignedTypesByApartment.get(apartment.id) ?? []
    ).map((slotType) => ({ apartment, slotType }))
  );

  const random = createSeededRandom(seed);
  const shuffledSlots = shuffleWithRng(pendingSlots, random);
  const spotPool = shuffleWithRng(availableSpots, random);
  const usedSpotIds = new Set<string>();
  const results: DrawAssignment[] = [];

  for (const { apartment, slotType } of shuffledSlots) {
    const spot = spotPool.find(
      (candidate) =>
        !usedSpotIds.has(candidate.id) &&
        spotEligibleForApartment(candidate, slotType, apartment)
    );
    if (!spot) continue;
    usedSpotIds.add(spot.id);
    results.push({ apartmentId: apartment.id, spotId: spot.id });
  }

  return results;
}
