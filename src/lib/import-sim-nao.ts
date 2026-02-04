/**
 * Normaliza valores SIM/NÃO (ou YES/NO, S/N, 1/0) para boolean.
 * Usado na importação adaptativa por planilha.
 */
const SIM_VALUES = new Set([
  "sim", "s", "yes", "y", "1", "x", "verdadeiro", "true", "v", "si",
]);
const NAO_VALUES = new Set([
  "não", "nao", "n", "no", "0", "falso", "false", "f", "",
]);

export function isSim(value: string | undefined | null): boolean {
  if (value == null) return false;
  const v = String(value).trim().toLowerCase();
  if (NAO_VALUES.has(v)) return false;
  if (SIM_VALUES.has(v)) return true;
  return false;
}

export function isNao(value: string | undefined | null): boolean {
  if (value == null) return true;
  const v = String(value).trim().toLowerCase();
  if (SIM_VALUES.has(v)) return false;
  return true;
}

/** Retorna true se for SIM, false se for NÃO. Valor vazio = false. */
export function parseSimNao(value: string | undefined | null): boolean {
  return isSim(value);
}

/**
 * Busca valor em objeto com chave case-insensitive (e variações com/sem acento).
 */
export function getRawKey(
  row: Record<string, string | undefined>,
  ...keys: string[]
): string {
  const rowLower: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    const n = (k ?? "").trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
    rowLower[n] = v ?? "";
  }
  for (const key of keys) {
    const n = key.trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
    if (rowLower[n] !== undefined) return (rowLower[n] ?? "").trim();
    // try exact key
    for (const [k, v] of Object.entries(row)) {
      if ((k ?? "").trim().toLowerCase() === key.trim().toLowerCase())
        return (v ?? "").trim();
    }
  }
  return "";
}
