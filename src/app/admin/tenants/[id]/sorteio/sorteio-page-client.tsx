"use client";

import { useState } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";

type ResultRow = {
  apartmentNumber: string;
  spotNumber: string;
  spotBasement: string | null;
  spotType: string;
  spotSpecialType: string | null;
};

type DrawResult = {
  drawId: string;
  createdAt: string;
  results: ResultRow[];
};

const SPOT_TYPE_LABELS: Record<string, string> = {
  simple: "Simples",
  double: "Dupla",
};
const SPECIAL_LABELS: Record<string, string> = {
  normal: "Normal",
  pne: "PNE",
  idoso: "Idoso",
  visitor: "Visitante",
};

export function SorteioPageClient({
  tenantId,
  tenantName,
  tenantSlug,
}: {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draw, setDraw] = useState<DrawResult | null>(null);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "";

  const resultUrl = draw
    ? `${baseUrl}/${tenantSlug}/resultado/${draw.drawId}`
    : "";

  async function handleSortear() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/draws/run`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erro ao executar sorteio.");
        setLoading(false);
        return;
      }
      setDraw({
        drawId: data.drawId,
        createdAt: data.createdAt,
        results: data.results ?? [],
      });
    } catch {
      setError("Erro de conexão.");
    }
    setLoading(false);
  }

  function handleExport() {
    if (!draw) return;
    window.open(
      `/api/admin/tenants/${tenantId}/draws/${draw.drawId}/export`,
      "_blank"
    );
  }

  const createdAtFormatted = draw?.createdAt
    ? new Date(draw.createdAt).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "";

  return (
    <div className="rounded-lg border border-[#e2deeb] bg-white p-8 shadow-sm">
      {!draw && !loading && (
        <div className="max-w-md mx-auto text-center">
          <p className="text-lg text-[#5b4d7a] mb-6">
            Clique aqui para iniciar o sorteio
          </p>
          <button
            type="button"
            onClick={handleSortear}
            className="rounded-lg bg-[#250E62] px-6 py-3 text-white font-medium hover:bg-[#1e0b4f] transition-colors"
          >
            Sortear
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Image
            src="/gifsorteio/sorteio-gif.gif"
            alt="Sorteando..."
            width={200}
            height={120}
            unoptimized
            className="mb-4"
          />
          <p className="text-[#5b4d7a]">Sorteando...</p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 mb-4" role="alert">
          {error}
        </p>
      )}

      {draw && !loading && (
        <div className="space-y-8">
          <h2 className="text-xl font-medium text-[#250E62] text-center">
            Resultados do Sorteio
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#faf9ff] border-b border-[#e2deeb]">
                <tr>
                  <th className="px-4 py-3 font-medium text-[#3F228D]">
                    Apartamento
                  </th>
                  <th className="px-4 py-3 font-medium text-[#3F228D]">Vaga</th>
                  <th className="px-4 py-3 font-medium text-[#3F228D]">
                    Localização
                  </th>
                  <th className="px-4 py-3 font-medium text-[#3F228D]">Tipo</th>
                  <th className="px-4 py-3 font-medium text-[#3F228D]">
                    Especial
                  </th>
                </tr>
              </thead>
              <tbody>
                {draw.results.map((r, i) => (
                  <tr
                    key={i}
                    className="border-b border-[#e2deeb] hover:bg-[#faf9ff]"
                  >
                    <td className="px-4 py-3">{r.apartmentNumber}</td>
                    <td className="px-4 py-3">{r.spotNumber}</td>
                    <td className="px-4 py-3">{r.spotBasement ?? "—"}</td>
                    <td className="px-4 py-3">
                      {SPOT_TYPE_LABELS[r.spotType] ?? r.spotType}
                    </td>
                    <td className="px-4 py-3">
                      {SPECIAL_LABELS[r.spotSpecialType ?? "normal"] ??
                        r.spotSpecialType}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-center text-[#5b4d7a]">
            Sorteio finalizado em {createdAtFormatted}.
          </p>

          <div className="flex flex-wrap gap-4 justify-center items-start">
            <button
              type="button"
              onClick={handleExport}
              className="rounded-lg bg-[#250E62] px-6 py-2 text-sm text-white hover:bg-[#1e0b4f]"
            >
              Exportar planilha
            </button>

            {resultUrl && (
              <div className="flex flex-col items-center gap-2">
                <QRCodeSVG value={resultUrl} size={160} level="M" />
                <p className="text-sm text-[#5b4d7a] max-w-[200px] text-center">
                  Escaneie o QR Code para acessar o resultado
                </p>
              </div>
            )}
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleSortear}
              className="text-sm text-[#5936CC] hover:text-[#250E62] underline"
            >
              Realizar novo sorteio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
