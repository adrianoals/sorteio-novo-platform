import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { draws, drawResults } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tenantId } = await params;

  const [list, counts] = await Promise.all([
    db
      .select({
        id: draws.id,
        createdAt: draws.createdAt,
        executedByUserId: draws.executedByUserId,
      })
      .from(draws)
      .where(eq(draws.tenantId, tenantId))
      .orderBy(desc(draws.createdAt)),
    db
      .select({
        drawId: drawResults.drawId,
        count: sql<number>`count(*)::int`.as("count"),
      })
      .from(drawResults)
      .where(eq(drawResults.tenantId, tenantId))
      .groupBy(drawResults.drawId),
  ]);

  const countMap = new Map(counts.map((c) => [c.drawId, c.count]));

  return NextResponse.json(
    list.map((d) => ({
      id: d.id,
      createdAt: d.createdAt,
      executedByUserId: d.executedByUserId,
      resultCount: Number(countMap.get(d.id)) || 0,
    })),
    {
      headers: {
        "Cache-Control": "private, s-maxage=30, stale-while-revalidate=60",
      },
    }
  );
}
