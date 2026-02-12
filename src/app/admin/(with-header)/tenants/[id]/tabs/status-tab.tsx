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

const RIGHTS_LABELS: Record<string, string> = {
  simple: "Simples",
  double: "Dupla",
  two_simple: "Duas simples",
  car: "Carro",
  moto: "Moto",
};
const SPOT_TYPE_LABELS: Record<string, string> = {
  simple: "Simples",
  double: "Dupla",
};

function labelRight(k: string): string {
  return RIGHTS_LABELS[k] ?? k;
}
function labelSpotType(k: string): string {
  return SPOT_TYPE_LABELS[k] ?? k;
}

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
    let cancelled = false;
    fetch(`/api/admin/tenants/${tenantId}/checks`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch(() => {
        if (!cancelled) setError("Erro ao carregar.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  if (loading) return <p className="text-[#5b4d7a]">Carregando…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!result) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <h3 className="font-medium text-[#250E62]">Status e prontidão</h3>
        <button
          type="button"
          onClick={load}
          className="text-sm text-[#5936CC] hover:text-[#250E62] underline"
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
        <div className="rounded-lg border border-[#e2deeb] p-4">
          <h4 className="font-medium text-[#250E62] mb-2">Resumo</h4>
          <p className="text-sm text-[#5b4d7a]">
            Apartamentos: <strong>{result.counts.apartments}</strong>
            {" "}· Vagas: <strong>{result.counts.spots}</strong>
          </p>
          {Object.keys(result.counts.apartmentsByRights).length > 0 && (
            <p className="text-sm text-[#5b4d7a] mt-1">
              Por direitos:{" "}
              {Object.entries(result.counts.apartmentsByRights)
                .map(([k, v]) => `${labelRight(k)}: ${v}`)
                .join(", ")}
            </p>
          )}
          {Object.keys(result.counts.spotsByType).length > 0 && (
            <p className="text-sm text-[#5b4d7a] mt-1">
              Por tipo de vaga:{" "}
              {Object.entries(result.counts.spotsByType)
                .map(([k, v]) => `${labelSpotType(k)}: ${v}`)
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
