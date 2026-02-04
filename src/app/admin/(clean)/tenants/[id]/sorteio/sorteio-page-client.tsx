"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
    <div className="w-full max-w-4xl rounded-xl border border-[#e2deeb] bg-white p-8 shadow-lg">
      {!draw && !loading && (
        <div className="text-center py-6">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="flex items-center justify-center gap-4">
              <Image
                src="/images/LogoSorteioNovoComFundoBranco.png"
                alt="Sorteio Novo"
                width={120}
                height={38}
                className="h-10 w-auto object-contain"
              />
              <h1 className="text-2xl font-bold text-[#250E62]">
                {tenantName}
              </h1>
            </div>
            <p className="text-[#5b4d7a] text-lg">
              Sorteio de vagas de garagem
            </p>
          </div>
          <p className="text-[#5b4d7a] mb-8 max-w-md mx-auto">
            Quando estiver pronto, clique no botão abaixo para realizar o sorteio na presença da assembleia.
          </p>
          {error && (
            <p className="text-sm text-red-600 mb-4" role="alert">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleSortear}
            className="rounded-lg bg-[#250E62] px-8 py-4 text-lg font-medium text-white hover:bg-[#1e0b4f] transition-colors shadow-md"
          >
            Iniciar sorteio
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Image
            src="/gifsorteio/sorteio-gif.gif"
            alt="Sorteando..."
            width={200}
            height={120}
            unoptimized
            className="mb-4"
          />
          <p className="text-[#5b4d7a] text-lg">Sorteando...</p>
        </div>
      )}

      {draw && !loading && (
        <div className="space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-2">
              <Image
                src="/images/LogoSorteioNovoComFundoBranco.png"
                alt="Sorteio Novo"
                width={120}
                height={38}
                className="h-10 w-auto object-contain"
              />
              <h1 className="text-2xl font-bold text-[#250E62]">
                {tenantName}
              </h1>
            </div>
            <p className="text-[#5b4d7a] mb-1">Sorteio de vagas de garagem</p>
            <h2 className="text-xl font-medium text-[#250E62] mt-4">
              Resultados do Sorteio
            </h2>
          </div>

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

          <div className="flex flex-col items-center justify-center text-center space-y-6">
            <p className="text-[#5b4d7a]">
              Sorteio finalizado em {createdAtFormatted}.
            </p>

            <button
              type="button"
              onClick={handleExport}
              className="rounded-lg bg-[#250E62] px-6 py-3 text-sm font-medium text-white hover:bg-[#1e0b4f] transition-colors"
            >
              Exportar planilha (Excel)
            </button>

            {resultUrl && (
              <div className="flex flex-col items-center gap-2 pt-2">
                <QRCodeSVG value={resultUrl} size={160} level="M" />
                <p className="text-sm text-[#5b4d7a] max-w-[220px]">
                  Escaneie o QR Code para acessar o resultado na página pública
                </p>
              </div>
            )}
          </div>

          <p className="text-center pt-4">
            <Link
              href={`/admin/tenants/${tenantId}`}
              className="text-sm text-[#5936CC] hover:text-[#250E62]"
            >
              ← Voltar ao condomínio
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
