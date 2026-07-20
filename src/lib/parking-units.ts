export function formatParkingUnitLabel(
  number: string,
  allocationType?: string | null,
  physicalSpots?: string[] | null
): string {
  if (allocationType !== "group" || !physicalSpots?.length) return number;
  return `${number} - Vagas: (${physicalSpots.join(", ")})`;
}

export function findPhysicalSpotConflict(
  requested: string[],
  existing: Array<{ id?: string; physicalSpots: string[] | null }>,
  ignoredId?: string
): string | null {
  const used = new Set(existing.filter((item) => item.id !== ignoredId).flatMap((item) => item.physicalSpots ?? []));
  return requested.find((spot) => used.has(spot)) ?? null;
}

export type PhysicalSpotLocationGroup = {
  location: string;
  spots: string[];
};

export function getPhysicalSpotLocationGroups(
  physicalSpots: string[] | null | undefined,
  attributes: unknown
): PhysicalSpotLocationGroup[] {
  if (!physicalSpots?.length || !attributes || typeof attributes !== "object") {
    return [];
  }
  const locations = (attributes as { physicalSpotLocations?: unknown })
    .physicalSpotLocations;
  if (!locations || typeof locations !== "object") return [];

  const groups = new Map<string, string[]>();
  for (const spot of physicalSpots) {
    const location = (locations as Record<string, unknown>)[spot];
    if (typeof location !== "string" || !location.trim()) continue;
    const normalized = location.trim();
    groups.set(normalized, [...(groups.get(normalized) ?? []), spot]);
  }
  return [...groups].map(([location, spots]) => ({ location, spots }));
}
