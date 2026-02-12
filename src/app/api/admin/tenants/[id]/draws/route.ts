import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { tenants, draws, drawResults } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

async function ensureTenant(tenantId: string) {
  const [t] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  return t ?? null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tenantId } = await params;
  if (!(await ensureTenant(tenantId))) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const list = await db
    .select({ id: draws.id, createdAt: draws.createdAt })
    .from(draws)
    .where(eq(draws.tenantId, tenantId))
    .orderBy(desc(draws.createdAt));

  const counts = await db
    .select({
      drawId: drawResults.drawId,
      count: sql<number>`count(*)::int`.as("count"),
    })
    .from(drawResults)
    .where(eq(drawResults.tenantId, tenantId))
    .groupBy(drawResults.drawId);

  const countMap = new Map(counts.map((c) => [c.drawId, c.count]));

  return NextResponse.json(
    list.map((d) => ({
      id: d.id,
      createdAt: d.createdAt,
      resultCount: Number(countMap.get(d.id)) || 0,
    }))
  );
}
