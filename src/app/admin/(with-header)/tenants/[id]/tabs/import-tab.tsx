"use client";

import { useState, useEffect } from "react";

type Tenant = {
  id: string;
  name: string;
  config?: {
    has_blocks?: boolean;
    has_basement?: boolean;
    basements?: string[];
  } | null;
};

type Block = { id: string; name: string; code: string | null };

type ImportResult = {
  inserted: number;
  updated: number;
  rejected: number;
  errors: { row: number; reason: string }[];
};

export function ImportTab({ tenant }: { tenant: Tenant }) {
  const tenantId = tenant.id;
  const config = tenant.config ?? {};
  const hasBlocks = !!config.has_blocks;
  const hasBasement = !!config.has_basement;
  const basements = config.basements ?? [];

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [type, setType] = useState<"apartments" | "spots">("apartments");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/tenants/${tenantId}/blocks`)
      .then((r) => r.json())
      .then((data) => setBlocks(Array.isArray(data) ? data : []))
      .catch(() => setBlocks([]));
  }, [tenantId]);

  function downloadTemplateSpots() {
    const headers = [
      "numero",
      ...(hasBlocks ? ["bloco"] : []),
      ...(hasBasement ? basements : []),
      "Simples",
      "Dupla",
      "Normal",
      "PNE",
      "Idoso",
      "Visitante",
    ];
    const example = [
      "V01",
      ...(hasBlocks ? [blocks[0]?.name ?? "Bloco A"] : []),
      ...(hasBasement ? basements.map((_, i) => (i === 0 ? "SIM" : "NÃO")) : []),
      "SIM",
      "NÃO",
      "SIM",
      "NÃO",
      "NÃO",
      "NÃO",
    ];
    const csv = [headers.join(","), example.join(",")].join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-vagas.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadTemplateApartments() {
    const headers = [
      "numero",
      ...(hasBlocks ? ["bloco"] : []),
      "Simples",
      "Dupla",
      "Duas simples",
      "Moto",
      ...(hasBasement ? basements.map((b) => `Pode ${b}`) : []),
      ...(hasBlocks ? blocks.map((b) => `Pode ${b.name}`) : []),
    ];
    const example = [
      "101",
      ...(hasBlocks ? [blocks[0]?.name ?? "Bloco A"] : []),
      "SIM",
      "NÃO",
      "NÃO",
      "NÃO",
      ...(hasBasement ? basements.map(() => "SIM") : []),
      ...(hasBlocks ? blocks.map(() => "SIM") : []),
    ];
    const csv = [headers.join(","), example.join(",")].join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-apartamentos.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

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
          A planilha se adapta à configuração do condomínio. Use <strong>SIM</strong> ou <strong>NÃO</strong> nas colunas indicadas (aceita também YES/NO, S/N, 1/0). Baixe o modelo, preencha e importe.
        </p>
        <p className="text-sm text-[#5b4d7a] mb-4">
          <button
            type="button"
            onClick={type === "apartments" ? downloadTemplateApartments : downloadTemplateSpots}
            className="font-medium text-[#5936CC] hover:text-[#250E62] underline"
          >
            Baixar planilha modelo ({type === "apartments" ? "apartamentos" : "vagas"})
          </button>
        </p>
        {type === "apartments" ? (
          <ul className="text-sm text-[#5b4d7a] list-disc list-inside mb-4 space-y-1">
            <li><strong>numero</strong> — número do apartamento (obrigatório)</li>
            {hasBlocks && <li><strong>bloco</strong> — nome ou código do bloco ao qual o apartamento pertence</li>}
            <li><strong>Simples, Dupla, Duas simples, Moto</strong> — use SIM em pelo menos um. &quot;Duas simples&quot; = 2 vagas simples (equivalente a adicionar Simples duas vezes).</li>
            {hasBasement && basements.length > 0 && (
              <li><strong>Pode [local]</strong> — SIM/NÃO para cada localização em que o apartamento pode concorrer ({basements.join(", ")})</li>
            )}
            {hasBlocks && blocks.length > 0 && (
              <li><strong>Pode [bloco]</strong> — SIM/NÃO para cada bloco em que pode ser sorteado</li>
            )}
          </ul>
        ) : (
          <ul className="text-sm text-[#5b4d7a] list-disc list-inside mb-4 space-y-1">
            <li><strong>numero</strong> — número da vaga (obrigatório)</li>
            {hasBlocks && <li><strong>bloco</strong> — nome ou código do bloco da vaga</li>}
            {hasBasement && basements.length > 0 && (
              <li><strong>Localização</strong> — uma coluna por local ({basements.join(", ")}): use SIM na localização da vaga e NÃO nas demais</li>
            )}
            <li><strong>Simples, Dupla</strong> — use SIM em exatamente um (tipo da vaga)</li>
            <li><strong>Normal, PNE, Idoso, Visitante</strong> — use SIM em exatamente um (condição especial)</li>
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
