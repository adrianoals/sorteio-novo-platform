"use client";

import { useState } from "react";

type ImportResult = {
  inserted: number;
  updated: number;
  rejected: number;
  errors: { row: number; reason: string }[];
};

export function ImportTab({ tenantId }: { tenantId: string }) {
  const [type, setType] = useState<"apartments" | "spots">("apartments");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Selecione um arquivo.");
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const url =
        type === "apartments"
          ? `/api/admin/tenants/${tenantId}/apartments/import`
          : `/api/admin/tenants/${tenantId}/spots/import`;
      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erro na importação.");
        setLoading(false);
        return;
      }
      setResult(data);
    } catch {
      setError("Erro de conexão.");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="font-medium text-[#250E62] mb-2">Importar dados</h3>
        <p className="text-sm text-[#5b4d7a] mb-2">
          Envie um arquivo CSV ou Excel. Colunas esperadas:
        </p>
        <p className="text-sm text-[#5b4d7a] mb-4">
          <a
            href={type === "apartments" ? "/templates/modelo-apartamentos.csv" : "/templates/modelo-vagas.csv"}
            download
            className="font-medium text-[#5936CC] hover:text-[#250E62] underline"
          >
            Baixar planilha modelo
          </a>
          {" "}— preencha com seus dados e importe.
        </p>
        {type === "apartments" ? (
          <ul className="text-sm text-[#5b4d7a] list-disc list-inside mb-4">
            <li><strong>numero</strong> — número do apartamento (obrigatório)</li>
            <li><strong>direitos</strong> — um ou mais: Simples, Dupla, Duas simples, Carro, Moto (separados por vírgula)</li>
            <li><strong>localização</strong> — opcional; localizações em que o apartamento pode concorrer (ex.: Subsolo 1, Térreo). Várias separadas por vírgula. Vazio = qualquer.</li>
            <li><strong>bloco</strong> — opcional; se usar blocos, preencha com o ID do bloco (aba Blocos)</li>
          </ul>
        ) : (
          <ul className="text-sm text-[#5b4d7a] list-disc list-inside mb-4">
            <li><strong>numero</strong> — número da vaga (obrigatório)</li>
            <li><strong>tipo</strong> — Simples ou Dupla</li>
            <li><strong>especial</strong> — Normal, PNE, Idoso ou Visitante</li>
            <li><strong>localização</strong> — opcional (ex.: Térreo, Subsolo 1)</li>
            <li><strong>bloco</strong> — opcional; se usar blocos, preencha com o ID do bloco (aba Blocos)</li>
          </ul>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#3F228D] mb-1">
            Tipo de importação
          </label>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value as "apartments" | "spots");
              setResult(null);
              setError(null);
            }}
            className="rounded border border-[#e2deeb] px-3 py-2"
          >
            <option value="apartments">Apartamentos</option>
            <option value="spots">Vagas</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#3F228D] mb-1">
            Arquivo (CSV ou Excel)
          </label>
          <input
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setResult(null);
              setError(null);
            }}
            className="block w-full text-sm text-[#5b4d7a] file:mr-4 file:rounded file:border-0 file:bg-[#faf9ff] file:px-4 file:py-2 file:text-[#1a0d2e]"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading || !file}
          className="rounded bg-[#250E62] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e0b4f] disabled:opacity-50"
        >
          {loading ? "Importando…" : "Importar"}
        </button>
      </form>

      {result && (
        <div className="rounded-lg border border-[#e2deeb] bg-[#faf9ff] p-4 space-y-2">
          <h4 className="font-medium text-[#250E62]">Resultado</h4>
          <p className="text-sm">
            Inseridos: <strong>{result.inserted}</strong>
            {result.updated > 0 && (
              <> · Atualizados: <strong>{result.updated}</strong></>
            )}
            {" "}· Rejeitados: <strong>{result.rejected}</strong>
          </p>
          {result.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-[#3F228D] mb-1">Erros por linha:</p>
              <ul className="text-sm text-[#5b4d7a] list-disc list-inside max-h-40 overflow-y-auto">
                {result.errors.slice(0, 50).map((e, i) => (
                  <li key={i}>
                    Linha {e.row}: {e.reason}
                  </li>
                ))}
                {result.errors.length > 50 && (
                  <li>… e mais {result.errors.length - 50} erros.</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
