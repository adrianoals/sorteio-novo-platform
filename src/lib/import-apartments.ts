import { parse } from "csv-parse/sync";

const RIGHTS = new Set<string>(["simple", "double", "two_simple", "car", "moto"]);

const RIGHTS_PT: Record<string, string> = {
  simples: "simple",
  dupla: "double",
  "duas simples": "two_simple",
  carro: "car",
  moto: "moto",
  simple: "simple",
  double: "double",
  two_simple: "two_simple",
  car: "car",
};

function normalizeRight(token: string): string {
  const key = token.trim().toLowerCase();
  return RIGHTS_PT[key] ?? key;
}

function parseRightsString(raw: string): string[] {
  const s = raw.trim();
  if (!s) return ["simple"];
  return s
    .split(/[,;]/)
    .map((t) => normalizeRight(t))
    .filter(Boolean);
}

export interface ApartmentRow {
  number: string;
  block_id?: string;
  /** Lista de direitos (ex.: simple, simple, double). Aceita coluna com valores separados por vírgula ou ponto-e-vírgula. */
  rights: string[];
}

export function parseApartmentCsv(buffer: Buffer): ApartmentRow[] {
  const text = buffer.toString("utf-8");
  const rows = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as Record<string, string>[];

  return rows.map((r) => {
    const raw = r.rights ?? r.direitos ?? r["Direitos"] ?? "simple";
    return {
      number: (r.number ?? r.numero ?? r["Número"] ?? "").trim(),
      block_id: (r.block_id ?? r.blockId ?? r.bloco ?? "").trim() || undefined,
      rights: parseRightsString(raw),
    };
  });
}

export function validateApartmentRow(
  row: ApartmentRow,
  rowIndex: number
): { ok: true } | { ok: false; row: number; reason: string } {
  if (!row.number) {
    return { ok: false, row: rowIndex, reason: "Número é obrigatório" };
  }
  if (row.number.length > 50) {
    return { ok: false, row: rowIndex, reason: "Número muito longo" };
  }
  if (!row.rights.length) {
    return { ok: false, row: rowIndex, reason: "Pelo menos um direito é obrigatório" };
  }
  for (const r of row.rights) {
    if (!RIGHTS.has(r)) {
      return { ok: false, row: rowIndex, reason: `Direito inválido: ${r}. Use: Simples, Dupla, Duas simples, Carro, Moto` };
    }
  }
  return { ok: true };
}

export function parseApartmentXlsx(buffer: Buffer): ApartmentRow[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require("xlsx");
  const wb = XLSX.read(buffer, { type: "buffer" });
  const first = wb.SheetNames[0];
  const sheet = wb.Sheets[first];
  const data = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

  return data.map((r) => {
    const num = String(r.number ?? r.numero ?? r["Número"] ?? "").trim();
    const block = String(r.block_id ?? r.blockId ?? r.bloco ?? "").trim();
    const raw = String(r.rights ?? r.direitos ?? r["Direitos"] ?? "simple");
    return {
      number: num,
      block_id: block || undefined,
      rights: parseRightsString(raw),
    };
  });
}
