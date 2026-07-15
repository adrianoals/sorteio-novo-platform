import type { ApartmentRightsList } from "@/db/schema";

export type DrawSlotType = "simple" | "double";

/** Converte direitos atuais e legados nos tipos de vaga usados pelo motor S1. */
export function expandRightsToSlotTypes(
  rights: ApartmentRightsList
): DrawSlotType[] {
  const slots: DrawSlotType[] = [];

  for (const right of rights as readonly string[]) {
    if (right === "simple" || right === "moto" || right === "car") {
      slots.push("simple");
    } else if (right === "double") {
      slots.push("double");
    } else if (right === "two_simple") {
      slots.push("simple", "simple");
    }
  }

  return slots;
}

/**
 * Remove da demanda apenas direitos compatíveis com as vagas já atribuídas.
 * Uma vaga simples nunca deve consumir um direito a vaga dupla, e vice-versa.
 */
export function getRemainingSlotTypes(
  rights: ApartmentRightsList,
  assignedSpotTypes: readonly string[]
): DrawSlotType[] {
  const remaining = expandRightsToSlotTypes(rights);

  for (const assignedType of assignedSpotTypes) {
    if (assignedType !== "simple" && assignedType !== "double") continue;
    const matchingIndex = remaining.indexOf(assignedType);
    if (matchingIndex >= 0) remaining.splice(matchingIndex, 1);
  }

  return remaining;
}
