"use client";

import { useEffect, useState } from "react";

type ChecksResult = {
  ok: boolean;
  okForSimpleDraw: boolean;
  warnings: string[];
  errors: string[];
  counts?: {
    apartments: number;
    spots: number;
    apartmentsByRights: Record<string, number>;
    spotsByType: Record<string, number>;
  };
};

export function StatusTab({ tenantId }: { tenantId: string }) {
  const [result, setResult] = useState<ChecksResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch(`/api/admin/tenants/${tenantId}/checks`)
      .then((r) => r.json())
      .then((data) => setResult(data))
      .catch(() => setError("Erro ao carregar."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [tenantId]);

  if (loading) return <p className="text-zinc-500">Carregando…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!result) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <h3 className="font-medium text-zinc-800">Status e prontidão</h3>
        <button
          type="button"
          onClick={load}
          className="text-sm text-zinc-600 hover:text-zinc-800 underline"
        >
          Atualizar
        </button>
      </div>

      <div
        className={`rounded-lg border p-4 ${
          result.okForSimpleDraw
            ? "border-emerald-200 bg-emerald-50"
            : result.ok
              ? "border-amber-200 bg-amber-50"
              : "border-red-200 bg-red-50"
        }`}
      >
        <p className="font-medium">
          {result.okForSimpleDraw
            ? "OK para sorteio simples"
            : result.ok
              ? "Dados consistentes, mas verifique avisos antes do sorteio."
              : "Há erros que precisam ser corrigidos."}
        </p>
      </div>

      {result.counts && (
        <div className="rounded-lg border border-zinc-200 p-4">
          <h4 className="font-medium text-zinc-800 mb-2">Resumo</h4>
          <p className="text-sm text-zinc-600">
            Apartamentos: <strong>{result.counts.apartments}</strong>
            {" "}· Vagas: <strong>{result.counts.spots}</strong>
          </p>
          {Object.keys(result.counts.apartmentsByRights).length > 0 && (
            <p className="text-sm text-zinc-600 mt-1">
              Por direitos:{" "}
              {Object.entries(result.counts.apartmentsByRights)
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ")}
            </p>
          )}
          {Object.keys(result.counts.spotsByType).length > 0 && (
            <p className="text-sm text-zinc-600 mt-1">
              Por tipo de vaga:{" "}
              {Object.entries(result.counts.spotsByType)
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ")}
            </p>
          )}
        </div>
      )}

      {result.errors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h4 className="font-medium text-red-800 mb-2">Erros</h4>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            {result.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {result.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h4 className="font-medium text-amber-800 mb-2">Avisos</h4>
          <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
