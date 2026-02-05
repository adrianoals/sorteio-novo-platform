import { parse } from "csv-parse/sync";
import { getRawKey, isSim } from "./import-sim-nao";

export type ApartmentConfig = {
  has_blocks?: boolean;
  has_basement?: boolean;
  basements?: string[];
};

export type BlockInfo = { id: string; name: string; code: string | null };

const RIGHTS = new Set<string>(["simple", "double", "moto"]);

const RIGHTS_PT: Record<string, string> = {
  simples: "simple",
  dupla: "double",
  carro: "simple",
  moto: "moto",
  simple: "simple",
  double: "double",
};

function normalizeRight(token: string): string {
  const key = token.trim().toLowerCase();
  return RIGHTS_PT[key] ?? key;
}

/** Normaliza e expande: "duas simples" / two_simple (legado) vira dois "simple". */
function expandRights(tokens: string[]): string[] {
  const out: string[] = [];
  for (const t of tokens) {
    const key = t.trim().toLowerCase();
    if (key === "duas simples" || key === "two_simple") {
      out.push("simple", "simple");
    } else {
      const r = normalizeRight(t);
      if (r && RIGHTS.has(r)) out.push(r);
    }
  }
  return out.length ? out : ["simple"];
}

function parseRightsString(raw: string): string[] {
  const s = raw.trim();
  if (!s) return ["simple"];
  const tokens = s.split(/[,;]/).map((t) => t.trim()).filter(Boolean);
  return expandRights(tokens);
}

function parseLocalizacoes(raw: string): string[] {
  const s = raw.trim();
  if (!s) return [];
  return s
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function parseIds(raw: string): string[] {
  const s = raw.trim();
  if (!s) return [];
  return s
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export interface ApartmentRow {
  number: string;
  /** Bloco a que o apartamento pertence. Coluna "bloco". */
  block_id?: string;
  /** Lista de direitos (ex.: simple, simple, double). Aceita coluna com valores separados por vírgula ou ponto-e-vírgula. */
  rights: string[];
  /** Localizações em que o apartamento pode concorrer (ex.: Subsolo 1, Térreo). Vazio = qualquer. */
  allowed_subsolos?: string[];
  /** Blocos em que o apartamento pode ser sorteado (IDs). Vazio = qualquer. */
  allowed_blocks?: string[];
}

/** Converte linha bruta (planilha adaptativa) em ApartmentRow. Aceita SIM/NÃO ou formato legado. */
export function mapRawRowToApartmentRow(
  raw: Record<string, string | undefined>,
  config: ApartmentConfig,
  blocks: BlockInfo[]
): ApartmentRow {
  const get = (...args: string[]) => getRawKey(raw as Record<string, string | undefined>, ...args);
  const numero = get("numero", "number", "Número") || "";
  const blocoRaw = get("bloco", "block", "block_id");
  const hasBlocks = !!config.has_blocks;
  const hasBasement = !!config.has_basement;
  const basements = config.basements ?? [];

  const simplesVal = get("Simples", "simples");
  const duplaVal = get("Dupla", "dupla");
  const duasSimplesVal = get("Duas simples", "duas simples");
  const motoVal = get("Moto", "moto");

  const usaAdaptativo =
    simplesVal !== "" || duplaVal !== "" || duasSimplesVal !== "" || motoVal !== "";

  let rights: string[];
  let allowed_subsolos: string[] | undefined;
  let allowed_blocks: string[] | undefined;

  if (usaAdaptativo) {
    rights = [];
    if (isSim(simplesVal)) rights.push("simple");
    if (isSim(duplaVal)) rights.push("double");
    if (isSim(duasSimplesVal)) {
      rights.push("simple");
      rights.push("simple");
    }
    if (isSim(motoVal)) rights.push("moto");
    if (rights.length === 0) rights = ["simple"];

    if (hasBasement && basements.length > 0) {
      allowed_subsolos = basements.filter((b) => isSim(get(b)));
    }
    if (hasBlocks && blocks.length > 0) {
      allowed_blocks = blocks
        .filter((b) => isSim(get("Pode " + b.name) || get(b.name)))
        .map((b) => b.id);
    }
  } else {
    const rawRights = get("direitos", "rights", "Direitos");
    rights = parseRightsString(rawRights || "simple");
    const rawLoc = get("localização permitida", "localizacao permitida", "localização", "localizacao");
    allowed_subsolos = parseLocalizacoes(rawLoc);
    const rawBlocos = get("blocos permitidos", "blocosPermitidos", "allowed_blocks");
    allowed_blocks = parseIds(rawBlocos);
  }

  let block_id: string | undefined;
  if (blocoRaw && blocks.length > 0) {
    const blocoTrim = blocoRaw.trim();
    const byId = blocks.find((b) => b.id === blocoTrim);
    const byName = blocks.find((b) => b.name.trim().toLowerCase() === blocoTrim.toLowerCase());
    const byCode = blocks.find((b) => b.code && b.code.trim().toLowerCase() === blocoTrim.toLowerCase());
    block_id = (byId ?? byName ?? byCode)?.id;
  } else if (blocoRaw) {
    block_id = blocoRaw;
  }

  return {
    number: numero,
    block_id,
    rights,
    allowed_subsolos: allowed_subsolos?.length ? allowed_subsolos : undefined,
    allowed_blocks: allowed_blocks?.length ? allowed_blocks : undefined,
  };
}

/** Retorna linhas brutas da planilha (para uso com mapRawRowToApartmentRow). */
export function parseApartmentCsvRaw(buffer: Buffer): Record<string, string>[] {
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
    const rawLoc =
      r["localização permitida"] ??
      r.localização_permitida ??
      r.localização ??
      r["localização"] ??
      r.localizacoes ??
      r.localizações ??
      r.subsolos_permitidos ??
      r.allowed_subsolos ??
      "";
    const rawBlocosPermitidos =
      r["blocos permitidos"] ??
      r.blocos_permitidos ??
      r.blocosPermitidos ??
      r.allowed_blocks ??
      "";
    return {
      number: (r.number ?? r.numero ?? r["Número"] ?? "").trim(),
      block_id: (r.block_id ?? r.blockId ?? r.bloco ?? "").trim() || undefined,
      rights: parseRightsString(raw),
      allowed_subsolos: parseLocalizacoes(rawLoc),
      allowed_blocks: parseIds(rawBlocosPermitidos),
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
      return { ok: false, row: rowIndex, reason: `Direito inválido: ${r}. Use: Simples, Dupla, Moto (para 2+ vagas simples, repita Simples)` };
    }
  }
  return { ok: true };
}

/** Retorna linhas brutas da planilha Excel (para uso com mapRawRowToApartmentRow). */
export function parseApartmentXlsxRaw(buffer: Buffer): Record<string, string>[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require("xlsx");
  const wb = XLSX.read(buffer, { type: "buffer" });
  const first = wb.SheetNames[0];
  const sheet = wb.Sheets[first];
  const data = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];
  return data.map((r) => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(r)) {
      out[k ?? ""] = v != null ? String(v).trim() : "";
    }
    return out;
  });
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
    const rawLoc = String(
      r["localização permitida"] ??
        r.localização_permitida ??
        r.localização ??
        r["localização"] ??
        r.localizacoes ??
        r.localizações ??
        r.subsolos_permitidos ??
        r.allowed_subsolos ??
        ""
    );
    const rawBlocosPermitidos = String(
      r["blocos permitidos"] ??
        r.blocos_permitidos ??
        r.blocosPermitidos ??
        r.allowed_blocks ??
        ""
    );
    return {
      number: num,
      block_id: block || undefined,
      rights: parseRightsString(raw),
      allowed_subsolos: parseLocalizacoes(rawLoc),
      allowed_blocks: parseIds(rawBlocosPermitidos),
    };
  });
}
