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

const SPOT_TYPE_PT: Record<string, string> = {
  simples: "simple",
  dupla: "double",
  simple: "simple",
  double: "double",
};
const SPECIAL_TYPE_PT: Record<string, string> = {
  normal: "normal",
  pne: "pne",
  idoso: "idoso",
  visitante: "visitor",
  visitor: "visitor",
};

function normalizeSpotType(raw: string): string {
  const key = raw.trim().toLowerCase();
  return SPOT_TYPE_PT[key] ?? key;
}
function normalizeSpecialType(raw: string): string {
  const key = raw.trim().toLowerCase();
  return SPECIAL_TYPE_PT[key] ?? key;
}

export function parseSpotCsv(buffer: Buffer): SpotRow[] {
  const text = buffer.toString("utf-8");
  const rows = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as Record<string, string>[];

  return rows.map((r) => {
    const rawTipo = r.spot_type ?? r.spotType ?? r.tipo ?? "simple";
    const rawEspecial = r.special_type ?? r.specialType ?? r.especial ?? "normal";
    const basementRaw =
      r.basement ?? r.subsolo ?? r["Subsolo"] ?? r.localização ?? r["localização"] ?? "";
    return {
      number: (r.number ?? r.numero ?? r["Número"] ?? "").trim(),
      block_id: (r.block_id ?? r.blockId ?? r.bloco ?? "").trim() || undefined,
      basement: basementRaw.trim() || undefined,
      spot_type: normalizeSpotType(rawTipo),
      special_type: normalizeSpecialType(rawEspecial),
    };
  });
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
    return { ok: false, row: rowIndex, reason: `Tipo inválido: ${row.spot_type}. Use: Simples ou Dupla` };
  }
  if (!SPECIAL_TYPES.has(row.special_type)) {
    return { ok: false, row: rowIndex, reason: `Especial inválido: ${row.special_type}. Use: Normal, PNE, Idoso ou Visitante` };
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

  return data.map((r) => {
    const rawTipo = String(r.spot_type ?? r.spotType ?? r.tipo ?? "simple");
    const rawEspecial = String(r.special_type ?? r.specialType ?? r.especial ?? "normal");
    const basementRaw = String(
      r.basement ?? r.subsolo ?? r["Subsolo"] ?? r.localização ?? r["localização"] ?? ""
    ).trim();
    return {
      number: String(r.number ?? r.numero ?? r["Número"] ?? "").trim(),
      block_id: (String(r.block_id ?? r.blockId ?? r.bloco ?? "").trim() || undefined) as string | undefined,
      basement: basementRaw || undefined,
      spot_type: normalizeSpotType(rawTipo),
      special_type: normalizeSpecialType(rawEspecial),
    };
  });
}
