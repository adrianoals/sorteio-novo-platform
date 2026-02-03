import { parse } from "csv-parse/sync";

export interface SpotRow {
  number: string;
  block_id?: string;
  basement?: string;
  spot_type: string;
  special_type: string;
}

const SPOT_TYPES = new Set(["simple", "double"]);
const SPECIAL_TYPES = new Set(["normal", "pne", "idoso", "visitor"]);

export function parseSpotCsv(buffer: Buffer): SpotRow[] {
  const text = buffer.toString("utf-8");
  const rows = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as Record<string, string>[];

  return rows.map((r) => ({
    number: (r.number ?? r.numero ?? r["Número"] ?? "").trim(),
    block_id: (r.block_id ?? r.blockId ?? r.bloco ?? "").trim() || undefined,
    basement: (r.basement ?? r.subsolo ?? r["Subsolo"] ?? "").trim() || undefined,
    spot_type: (r.spot_type ?? r.spotType ?? r.tipo ?? "simple").trim().toLowerCase(),
    special_type: (r.special_type ?? r.specialType ?? r.especial ?? "normal").trim().toLowerCase(),
  }));
}

export function validateSpotRow(
  row: SpotRow,
  rowIndex: number
): { ok: true } | { ok: false; row: number; reason: string } {
  if (!row.number) {
    return { ok: false, row: rowIndex, reason: "Número é obrigatório" };
  }
  if (row.number.length > 50) {
    return { ok: false, row: rowIndex, reason: "Número muito longo" };
  }
  if (!SPOT_TYPES.has(row.spot_type)) {
    return { ok: false, row: rowIndex, reason: `spot_type inválido: ${row.spot_type}. Use: simple, double` };
  }
  if (!SPECIAL_TYPES.has(row.special_type)) {
    return { ok: false, row: rowIndex, reason: `special_type inválido: ${row.special_type}. Use: normal, pne, idoso, visitor` };
  }
  return { ok: true };
}

export function parseSpotXlsx(buffer: Buffer): SpotRow[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require("xlsx");
  const wb = XLSX.read(buffer, { type: "buffer" });
  const first = wb.SheetNames[0];
  const sheet = wb.Sheets[first];
  const data = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

  return data.map((r) => ({
    number: String(r.number ?? r.numero ?? r["Número"] ?? "").trim(),
    block_id: (String(r.block_id ?? r.blockId ?? r.bloco ?? "").trim() || undefined) as string | undefined,
    basement: (String(r.basement ?? r.subsolo ?? r["Subsolo"] ?? "").trim() || undefined) as string | undefined,
    spot_type: String(r.spot_type ?? r.spotType ?? r.tipo ?? "simple").trim().toLowerCase(),
    special_type: String(r.special_type ?? r.specialType ?? r.especial ?? "normal").trim().toLowerCase(),
  }));
}
