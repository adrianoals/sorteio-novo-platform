import { notFound } from "next/navigation";
import { getPublicDrawBySlugAndId } from "@/lib/draws-public";
import { ResultadoPageClient } from "./resultado-page-client";

export default async function ResultadoPublicPage({
  params,
}: {
  params: Promise<{ slug: string; drawId: string }>;
}) {
  const { slug, drawId } = await params;

  if (slug === "admin") notFound();

  const data = await getPublicDrawBySlugAndId(slug, drawId);
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-[#faf9ff] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <ResultadoPageClient
          tenantName={data.tenantName}
          hasBlocks={data.hasBlocks}
          createdAtFormatted={data.createdAtFormatted}
          results={data.results}
        />
      </div>
    </div>
  );
}
