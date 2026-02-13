"use client";

import { useState, useMemo } from "react";

type ResultRow = {
  apartmentNumber: string;
  apartmentId: string;
  blockName: string;
  spotNumber: string;
  spotBasement: string;
  spotTypeLabel: string;
  spotSpecialLabel: string;
};

export function ResultadoPageClient({
  tenantName,
  hasBlocks,
  createdAtFormatted,
  results,
}: {
  tenantName: string;
  hasBlocks: boolean;
  createdAtFormatted: string;
  results: ResultRow[];
}) {
  const [selectedBlock, setSelectedBlock] = useState<string>("");
  const [selectedApartment, setSelectedApartment] = useState<string>("");

  const resultsByApartment = useMemo(
    () =>
      [...results].sort((a, b) =>
        String(a.apartmentNumber).localeCompare(String(b.apartmentNumber), "pt-BR", { numeric: true })
      ),
    [results]
  );

  const blockNames = useMemo(() => {
    if (!hasBlocks) return [];
    const set = new Set(resultsByApartment.map((r) => r.blockName).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
  }, [resultsByApartment, hasBlocks]);

  const apartmentNumbers = useMemo(() => {
    let list = resultsByApartment;
    if (selectedBlock) {
      list = list.filter((r) => r.blockName === selectedBlock);
    }
    const set = new Set(list.map((r) => r.apartmentNumber));
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [resultsByApartment, selectedBlock]);

  const filteredResults = useMemo(() => {
    if (!selectedApartment) return [];
    return resultsByApartment.filter((r) => r.apartmentNumber === selectedApartment);
  }, [resultsByApartment, selectedApartment]);

  const handleBlockChange = (block: string) => {
    setSelectedBlock(block);
    setSelectedApartment("");
  };

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

      <div className="space-y-4 mb-6">
        {hasBlocks && blockNames.length > 1 && (
          <div>
            <label
              htmlFor="block-select"
              className="block text-sm font-medium text-[#3F228D] mb-2"
            >
              Selecione o bloco
            </label>
            <select
              id="block-select"
              value={selectedBlock}
              onChange={(e) => handleBlockChange(e.target.value)}
              className="w-full rounded border border-[#e2deeb] px-4 py-3 text-[#250E62] bg-white"
            >
              <option value="">Todos os blocos</option>
              {blockNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
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
            <option value="">— Selecione —</option>
            {apartmentNumbers.map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedApartment && (
        <p className="text-center text-[#5b4d7a] py-8">
          Selecione seu apartamento para ver a vaga sorteada.
        </p>
      )}

      {selectedApartment && filteredResults.length === 0 && (
        <p className="text-center text-[#5b4d7a] py-8">
          Nenhum resultado encontrado para este apartamento.
        </p>
      )}

      <div className="space-y-3">
        {filteredResults.map((r, i) => (
          <div
            key={i}
            className="rounded-lg border border-[#e2deeb] bg-[#faf9ff] p-5"
          >
            <p className="text-lg font-medium text-[#250E62] text-center">
              Vaga {r.spotNumber}
              {r.spotBasement ? ` — ${r.spotBasement}` : ""}
            </p>
            <p className="text-sm text-[#5b4d7a] text-center mt-1">
              {r.spotTypeLabel}
              {r.spotSpecialLabel !== "Normal"
                ? ` · ${r.spotSpecialLabel}`
                : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
