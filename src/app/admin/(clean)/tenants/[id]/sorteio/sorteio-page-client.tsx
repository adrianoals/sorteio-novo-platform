"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { compareDrawResults } from "@/lib/draw-result-order";

type ResultRow = {
  apartmentNumber: string;
  blockName: string | null;
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
  const [revealedCount, setRevealedCount] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);
  const resultsContainerRef = useRef<HTMLDivElement | null>(null);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "";

  const resultUrl = draw
    ? `${baseUrl}/${tenantSlug}/resultado/${draw.drawId}`
    : "";

  const resultsByApartment = useMemo(() => {
    if (!draw || draw.results.length === 0) return [];
    return [...draw.results].sort(compareDrawResults);
  }, [draw]);
  const visibleResults = resultsByApartment.slice(0, revealedCount);

  /** Ritmo da revelação progressiva. 172 linhas levam aproximadamente 13 segundos. */
  const RESULT_REVEAL_INTERVAL_MS = 75;
  const animationActive = loading || isRevealing;

  useEffect(() => {
    if (!draw || !isRevealing) return;
    if (revealedCount >= resultsByApartment.length) return;
    const timer = window.setTimeout(() => {
      const nextCount = revealedCount + 1;
      setRevealedCount(nextCount);
      if (nextCount >= resultsByApartment.length) setIsRevealing(false);
    }, RESULT_REVEAL_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [draw, isRevealing, revealedCount, resultsByApartment.length]);

  useEffect(() => {
    if (revealedCount > 0) {
      resultsContainerRef.current?.scrollTo({
        top: resultsContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [revealedCount]);

  function beginReveal(nextDraw: DrawResult) {
    setDraw(nextDraw);
    setRevealedCount(0);
    setIsRevealing(true);
    setLoading(false);
  }

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
      beginReveal({
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

  function handleDownloadQrCode() {
    const svg = document.getElementById("result-qrcode");
    if (!(svg instanceof SVGSVGElement)) return;
    const serialized = new XMLSerializer().serializeToString(svg);
    const source = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
    const sourceUrl = URL.createObjectURL(source);
    const image = new window.Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `qrcode-resultado-${tenantSlug}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }, "image/png");
      URL.revokeObjectURL(sourceUrl);
    };
    image.src = sourceUrl;
  }

  async function handleCopyResultLink() {
    if (!resultUrl) return;
    await navigator.clipboard.writeText(resultUrl);
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

      {(draw || loading) && (
        <div className="space-y-8 resultado-sorteio-print">
          {animationActive && (
            <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center">
              <div className="flex flex-col items-center rounded-3xl bg-white/80 px-8 py-5 shadow-2xl backdrop-blur-[2px]">
              <Image
                src="/gifsorteio/sorteio-gif.gif"
                alt="Sorteando..."
                width={440}
                height={264}
                unoptimized
                className="w-[min(440px,78vw)] h-auto object-contain"
              />
              <p className="text-[#5b4d7a] text-xl font-medium">
                {draw
                  ? `Sorteando... ${revealedCount} de ${resultsByApartment.length}`
                  : "Preparando o sorteio..."}
              </p>
              </div>
            </div>
          )}
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

          <div
            ref={resultsContainerRef}
            className={
              animationActive
                ? "max-h-[68vh] overflow-auto border border-[#e2deeb] rounded-lg opacity-70"
                : "overflow-x-auto"
            }
          >
            <table className="w-full text-left text-sm">
              <thead className="bg-[#faf9ff] border-b border-[#e2deeb]">
                <tr>
                  <th className="px-4 py-3 font-medium text-[#3F228D]">Bloco</th>
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
                {visibleResults.map((r, i) => (
                  <tr
                    key={i}
                    className="border-b border-[#e2deeb] hover:bg-[#faf9ff] animate-[fadeIn_0.35s_ease-out]"
                  >
                    <td className="px-4 py-3">{r.blockName ?? "—"}</td>
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

          {draw && !animationActive && (
          <div className="flex flex-col items-center justify-center text-center space-y-6">
            <p className="text-[#5b4d7a]">
              Sorteio finalizado em {createdAtFormatted}.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 no-print">
              <button
                type="button"
                onClick={handleExport}
                className="rounded-lg bg-[#250E62] px-6 py-3 text-sm font-medium text-white hover:bg-[#1e0b4f] transition-colors"
              >
                Exportar planilha (Excel)
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-lg border border-[#250E62] px-6 py-3 text-sm font-medium text-[#250E62] hover:bg-[#faf9ff] transition-colors"
              >
                Imprimir
              </button>
            </div>

            {resultUrl && (
              <div className="flex flex-col items-center gap-2 pt-2 no-print">
                <QRCodeSVG id="result-qrcode" value={resultUrl} size={160} level="M" marginSize={2} />
                <p className="text-sm text-[#5b4d7a] max-w-[220px]">
                  Escaneie o QR Code para acessar o resultado na página pública
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadQrCode}
                    className="rounded-lg border border-[#250E62] px-4 py-2 text-sm font-medium text-[#250E62] hover:bg-[#faf9ff]"
                  >
                    Baixar QR Code (PNG)
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyResultLink}
                    className="rounded-lg border border-[#e2deeb] px-4 py-2 text-sm font-medium text-[#5936CC] hover:bg-[#faf9ff]"
                  >
                    Copiar link público
                  </button>
                </div>
              </div>
            )}
          </div>
          )}

          {draw && !animationActive && <p className="text-center pt-4 no-print">
            <Link
              href={`/admin/tenants/${tenantId}`}
              className="text-sm text-[#5936CC] hover:text-[#250E62]"
            >
              ← Voltar ao condomínio
            </Link>
          </p>}
        </div>
      )}
    </div>
  );
}
