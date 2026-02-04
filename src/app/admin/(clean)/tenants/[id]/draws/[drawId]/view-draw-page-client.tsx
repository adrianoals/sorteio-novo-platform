"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

type ResultRow = {
  apartmentNumber: string;
  spotNumber: string;
  spotBasement: string | null;
  spotType: string;
  spotSpecialType: string | null;
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

export function ViewDrawPageClient({
  tenantId,
  tenantSlug,
  drawId,
  createdAt,
  results,
}: {
  tenantId: string;
  tenantSlug: string;
  drawId: string;
  createdAt: string;
  results: ResultRow[];
}) {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "";
  const resultUrl = `${baseUrl}/${tenantSlug}/resultado/${drawId}`;

  const createdAtFormatted = (() => {
    try {
      return new Date(createdAt).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return createdAt;
    }
  })();

  function handleExport() {
    window.open(
      `/api/admin/tenants/${tenantId}/draws/${drawId}/export`,
      "_blank"
    );
  }

  return (
    <div className="w-full max-w-4xl rounded-lg border border-[#e2deeb] bg-white p-8 shadow-sm">
      <h2 className="text-xl font-medium text-[#250E62] text-center mb-6">
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
            {results.map((r, i) => (
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

      <p className="text-center text-[#5b4d7a] mt-6">
        Sorteio realizado em {createdAtFormatted}.
      </p>

      <div className="flex flex-wrap gap-4 justify-center items-start mt-8">
        <button
          type="button"
          onClick={handleExport}
          className="rounded-lg bg-[#250E62] px-6 py-2 text-sm text-white hover:bg-[#1e0b4f]"
        >
          Exportar planilha (Excel)
        </button>

        <div className="flex flex-col items-center gap-2">
          <QRCodeSVG value={resultUrl} size={160} level="M" />
          <p className="text-sm text-[#5b4d7a] max-w-[200px] text-center">
            Escaneie o QR Code para acessar o resultado
          </p>
        </div>
      </div>

      <p className="text-center pt-8">
        <Link
          href={`/admin/tenants/${tenantId}`}
          className="text-sm text-[#5936CC] hover:text-[#250E62]"
        >
          ← Voltar ao condomínio
        </Link>
      </p>
    </div>
  );
}
