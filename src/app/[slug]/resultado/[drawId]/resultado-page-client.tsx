"use client";

import { useState, useMemo } from "react";

type ResultRow = {
  apartmentNumber: string;
  apartmentId: string;
  spotNumber: string;
  spotBasement: string;
  spotTypeLabel: string;
  spotSpecialLabel: string;
};

export function ResultadoPageClient({
  tenantName,
  createdAtFormatted,
  results,
}: {
  tenantName: string;
  createdAtFormatted: string;
  results: ResultRow[];
}) {
  const [selectedApartment, setSelectedApartment] = useState<string>("");

  const apartmentNumbers = useMemo(() => {
    const set = new Set(results.map((r) => r.apartmentNumber));
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [results]);

  const filteredResults = useMemo(() => {
    if (!selectedApartment) return results;
    return results.filter((r) => r.apartmentNumber === selectedApartment);
  }, [results, selectedApartment]);

  return (
    <div className="rounded-lg border border-[#e2deeb] bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-light tracking-tight text-[#250E62] text-center mb-2">
        Resultado do Sorteio
      </h1>
      <p className="text-lg font-medium text-[#3F228D] text-center mb-2">
        {tenantName}
      </p>
      <p className="text-sm text-[#5b4d7a] text-center mb-8">
        Sorteio realizado em {createdAtFormatted}
      </p>

      <div className="mb-6">
        <label
          htmlFor="apartment-select"
          className="block text-sm font-medium text-[#3F228D] mb-2"
        >
          Selecione seu apartamento
        </label>
        <select
          id="apartment-select"
          value={selectedApartment}
          onChange={(e) => setSelectedApartment(e.target.value)}
          className="w-full rounded border border-[#e2deeb] px-4 py-3 text-[#250E62] bg-white"
        >
          <option value="">Todos</option>
          {apartmentNumbers.map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {filteredResults.map((r, i) => (
          <div
            key={i}
            className="rounded-lg border border-[#e2deeb] bg-[#faf9ff] p-4"
          >
            <p className="text-lg font-medium text-[#250E62] text-center">
              {r.spotNumber}
              {r.spotBasement ? ` — ${r.spotBasement}` : ""}
            </p>
            {!selectedApartment && (
              <p className="text-sm text-[#5b4d7a] text-center mt-1">
                Apt. {r.apartmentNumber} · {r.spotTypeLabel}
                {r.spotSpecialLabel !== "Normal"
                  ? ` · ${r.spotSpecialLabel}`
                  : ""}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
