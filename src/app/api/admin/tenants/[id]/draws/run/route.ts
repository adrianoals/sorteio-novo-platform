import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  tenants,
  draws,
  drawResults,
  apartments,
  parkingSpots,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { runDrawS1 } from "@/lib/draw-engine-s1";
import { logAudit } from "@/lib/audit";

async function ensureTenant(tenantId: string) {
  const [t] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  return t ?? null;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tenantId } = await params;
  const tenant = await ensureTenant(tenantId);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const { results } = await runDrawS1(tenantId);
  const [draw] = await db
    .insert(draws)
    .values({ tenantId })
    .returning({ id: draws.id, createdAt: draws.createdAt });

  if (!draw) {
    return NextResponse.json(
      { error: "Falha ao criar registro do sorteio" },
      { status: 500 }
    );
  }

  if (results.length > 0) {
    await db.insert(drawResults).values(
      results.map((r) => ({
        drawId: draw.id,
        apartmentId: r.apartmentId,
        spotId: r.spotId,
      }))
    );
  }

  const actorId = session.user?.id ?? session.user?.email ?? "unknown";
  await logAudit(String(actorId), "create", "draw", draw.id, tenantId, {
    resultCount: results.length,
  });

  const resultsWithDetails = await db
    .select({
      apartmentNumber: apartments.number,
      spotNumber: parkingSpots.number,
      spotBasement: parkingSpots.basement,
      spotType: parkingSpots.spotType,
      spotSpecialType: parkingSpots.specialType,
    })
    .from(drawResults)
    .innerJoin(apartments, eq(drawResults.apartmentId, apartments.id))
    .innerJoin(parkingSpots, eq(drawResults.spotId, parkingSpots.id))
    .where(eq(drawResults.drawId, draw.id));

  return NextResponse.json({
    drawId: draw.id,
    createdAt: draw.createdAt,
    results: resultsWithDetails,
  });
}
