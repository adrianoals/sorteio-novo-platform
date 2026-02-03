import { parse } from "csv-parse/sync";

const RIGHTS = new Set<string>(["simple", "double", "two_simple", "car", "moto"]);

export interface ApartmentRow {
  number: string;
  block_id?: string;
  rights: string;
}

export function parseApartmentCsv(buffer: Buffer): ApartmentRow[] {
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
    rights: (r.rights ?? r.direitos ?? r["Direitos"] ?? "simple").trim().toLowerCase(),
  }));
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
  if (!RIGHTS.has(row.rights)) {
    return { ok: false, row: rowIndex, reason: `Direitos inválido: ${row.rights}. Use: simple, double, two_simple, car, moto` };
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
    const rights = String(r.rights ?? r.direitos ?? r["Direitos"] ?? "simple").trim().toLowerCase();
    return {
      number: num,
      block_id: block || undefined,
      rights,
    };
  });
}
