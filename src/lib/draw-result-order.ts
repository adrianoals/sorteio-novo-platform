export type ResultOrderRow = {
  blockName?: string | null;
  apartmentNumber: string;
};

const collator = new Intl.Collator("pt-BR", {
  numeric: true,
  sensitivity: "base",
});

/** Ordena primeiro por bloco/torre e depois pelo número natural do apartamento. */
export function compareDrawResults(
  left: ResultOrderRow,
  right: ResultOrderRow
): number {
  const blockComparison = collator.compare(
    left.blockName ?? "",
    right.blockName ?? ""
  );
  if (blockComparison !== 0) return blockComparison;
  return collator.compare(left.apartmentNumber, right.apartmentNumber);
}
