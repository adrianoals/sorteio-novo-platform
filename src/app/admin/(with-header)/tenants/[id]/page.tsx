import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { tenants, apartments, blocks, parkingSpots, draws, drawResults } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { TenantTabs } from "./tenant-tabs";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, id))
    .limit(1);
  if (!tenant) notFound();

  const [apartmentsList, blocksList, spotsList, apartmentsMinimal, drawsList, drawCounts] =
    await Promise.all([
      db
        .select()
        .from(apartments)
        .where(eq(apartments.tenantId, id))
        .orderBy(apartments.number),
      db
        .select()
        .from(blocks)
        .where(eq(blocks.tenantId, id))
        .orderBy(blocks.name),
      db
        .select()
        .from(parkingSpots)
        .where(eq(parkingSpots.tenantId, id))
        .orderBy(parkingSpots.number),
      db
        .select({
          id: apartments.id,
          number: apartments.number,
          blockId: apartments.blockId,
        })
        .from(apartments)
        .where(eq(apartments.tenantId, id))
        .orderBy(apartments.number),
      db
        .select({
          id: draws.id,
          createdAt: draws.createdAt,
          executedByUserId: draws.executedByUserId,
        })
        .from(draws)
        .where(eq(draws.tenantId, id))
        .orderBy(desc(draws.createdAt)),
      db
        .select({
          drawId: drawResults.drawId,
          count: sql<number>`count(*)::int`.as("count"),
        })
        .from(drawResults)
        .where(eq(drawResults.tenantId, id))
        .groupBy(drawResults.drawId),
    ]);

  const countMap = new Map(drawCounts.map((c) => [c.drawId, c.count]));
  const drawsWithCounts = drawsList.map((d) => ({
    id: d.id,
    createdAt: d.createdAt,
    executedByUserId: d.executedByUserId,
    resultCount: Number(countMap.get(d.id)) || 0,
  }));

  const fallback: Record<string, unknown> = {
    [`/api/admin/tenants/${id}/apartments/context`]: {
      apartments: apartmentsList,
      blocks: blocksList,
    },
    [`/api/admin/tenants/${id}/spots/context`]: {
      spots: spotsList,
      blocks: blocksList,
      apartments: apartmentsMinimal,
    },
    [`/api/admin/tenants/${id}/blocks`]: blocksList,
    [`/api/admin/tenants/${id}/draws`]: drawsWithCounts,
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link
            href="/admin"
            className="text-sm font-medium text-[#5936CC] hover:text-[#250E62]"
          >
            ← Condomínios
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-[#250E62]">
            {tenant.name}
          </h1>
          <p className="text-sm text-[#5b4d7a]">{tenant.slug}</p>
        </div>
        <Link
          href={`/admin/tenants/${tenant.id}/sorteio`}
          className="rounded-lg bg-[#250E62] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e0b4f] transition-colors shrink-0"
        >
          Novo sorteio
        </Link>
      </div>
      <TenantTabs tenant={tenant} fallback={fallback} />
    </div>
  );
}
