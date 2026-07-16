import { parse } from "csv-parse/sync";
import { getRawKey, isSim } from "./import-sim-nao";
import { readFirstWorksheetRows } from "./read-xlsx";

export interface SpotRow {
  number: string;
  block_id?: string;
  basement?: string;
  spot_type: string;
  special_type: string;
  allocation_type: "individual" | "group";
  physical_spots: string[];
}

export type SpotConfig = {
  has_blocks?: boolean;
  has_basement?: boolean;
  basements?: string[];
  parking_allocation_mode?: "individual" | "group" | "mixed";
};

export type BlockInfo = { id: string; name: string; code: string | null };

const SPOT_TYPES = new Set(["simple", "double"]);
const SPECIAL_TYPES = new Set(["normal", "pne", "idoso", "visitor"]);
const ALLOCATION_TYPES = new Set(["individual", "group"]);

function parsePhysicalSpots(raw: string): string[] {
  return [...new Set(raw.replace(/[()\[\]]/g, "").split(/[,;|]/).map((v) => v.trim()).filter(Boolean))];
}

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

/** Converte linha bruta (planilha) em SpotRow. Aceita formato adaptativo (SIM/NÃO) ou legado (tipo, especial). */
export function mapRawRowToSpotRow(
  raw: Record<string, string | undefined>,
  config: SpotConfig,
  blocks: BlockInfo[]
): SpotRow {
  const get = (...args: string[]) => getRawKey(raw as Record<string, string | undefined>, ...args);
  const numero = get("numero", "number", "Número") || get("numero");
  const blocoRaw = get("bloco", "block", "block_id");
  const hasBlocks = !!config.has_blocks;
  const hasBasement = !!config.has_basement;
  const basements = config.basements ?? [];

  // Formato adaptativo: colunas Simples, Dupla, Normal, PNE, Idoso, Visitante com SIM/NÃO
  const simplesVal = get("Simples", "simples");
  const duplaVal = get("Dupla", "dupla");
  const normalVal = get("Normal", "normal");
  const pneVal = get("PNE", "pne");
  const idosoVal = get("Idoso", "idoso");
  const visitanteVal = get("Visitante", "visitante");

  const usaAdaptativo =
    simplesVal !== "" || duplaVal !== "" || normalVal !== "" || pneVal !== "" || idosoVal !== "" || visitanteVal !== "";

  let spot_type: string;
  let special_type: string;

  if (usaAdaptativo) {
    if (isSim(simplesVal)) spot_type = "simple";
    else if (isSim(duplaVal)) spot_type = "double";
    else spot_type = "simple";

    if (isSim(normalVal)) special_type = "normal";
    else if (isSim(pneVal)) special_type = "pne";
    else if (isSim(idosoVal)) special_type = "idoso";
    else if (isSim(visitanteVal)) special_type = "visitor";
    else special_type = "normal";
  } else {
    const rawTipo = get("tipo", "spot_type", "spotType") || "simple";
    const rawEspecial = get("especial", "special_type", "specialType") || "normal";
    spot_type = normalizeSpotType(rawTipo);
    special_type = normalizeSpecialType(rawEspecial);
  }

  let basement: string | undefined;
  if (hasBasement && basements.length > 0) {
    if (usaAdaptativo) {
      const found = basements.find((b) => isSim(get(b)));
      basement = found ?? undefined;
    } else {
      const loc = get("localização", "localizacao", "basement", "subsolo");
      basement = loc || undefined;
    }
  }

  let block_id: string | undefined;
  if (blocoRaw && blocks.length > 0) {
    const blocoTrim = blocoRaw.trim();
    const byId = blocks.find((b) => b.id === blocoTrim);
    const byName = blocks.find((b) => b.name.trim().toLowerCase() === blocoTrim.toLowerCase());
    const byCode = blocks.find((b) => b.code && b.code.trim().toLowerCase() === blocoTrim.toLowerCase());
    block_id = (byId ?? byName ?? byCode)?.id;
  } else if (blocoRaw && !hasBlocks) {
    block_id = undefined;
  } else if (blocoRaw) {
    block_id = blocoRaw;
  }

  return {
    number: numero,
    block_id: block_id || undefined,
    basement: basement ?? (get("localização", "localizacao", "basement", "subsolo") || undefined),
    spot_type,
    special_type,
    allocation_type: (() => {
      const rawType = get("tipo de alocação", "tipo de alocacao", "tipo_alocacao", "allocation_type").trim().toLowerCase();
      if (rawType === "grupo" || rawType === "group") return "group";
      if (rawType === "individual") return "individual";
      return config.parking_allocation_mode === "group" ? "group" : "individual";
    })(),
    physical_spots: parsePhysicalSpots(get("vagas físicas", "vagas fisicas", "vagas_fisicas", "physical_spots", "composição", "composicao")),
  };
}

/** Retorna linhas brutas da planilha (para uso com mapRawRowToSpotRow). */
export function parseSpotCsvRaw(buffer: Buffer): Record<string, string>[] {
  const text = buffer.toString("utf-8");
  const rows = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as Record<string, string>[];
  return rows.map((r) => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(r)) {
      out[k ?? ""] = v != null ? String(v).trim() : "";
    }
    return out;
  });
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
      allocation_type: String(r.allocation_type ?? r.tipo_alocacao ?? "individual").toLowerCase() === "grupo" ? "group" : "individual",
      physical_spots: parsePhysicalSpots(r.physical_spots ?? r.vagas_fisicas ?? ""),
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
  if (!ALLOCATION_TYPES.has(row.allocation_type)) {
    return { ok: false, row: rowIndex, reason: "Tipo de alocação inválido. Use: Individual ou Grupo" };
  }
  if (row.allocation_type === "group" && row.physical_spots.length === 0) {
    return { ok: false, row: rowIndex, reason: "Grupos precisam informar as vagas físicas" };
  }
  return { ok: true };
}

/** Retorna linhas brutas da planilha Excel (para uso com mapRawRowToSpotRow). */
export function parseSpotXlsxRaw(
  buffer: Buffer
): Promise<Record<string, string>[]> {
  return readFirstWorksheetRows(buffer);
}

export async function parseSpotXlsx(buffer: Buffer): Promise<SpotRow[]> {
  const data = await readFirstWorksheetRows(buffer);
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
      allocation_type: String(r.allocation_type ?? r.tipo_alocacao ?? "individual").toLowerCase() === "grupo" ? "group" : "individual",
      physical_spots: parsePhysicalSpots(String(r.physical_spots ?? r.vagas_fisicas ?? "")),
    };
  });
}
