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
