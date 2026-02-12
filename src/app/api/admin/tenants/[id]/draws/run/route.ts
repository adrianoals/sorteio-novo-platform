import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { tenants, draws, drawResults } from "@/db/schema";
import { eq } from "drizzle-orm";
import { runDrawS1 } from "@/lib/draw-engine-s1";
import { logAudit } from "@/lib/audit";
import { getFullDrawResults } from "@/lib/draw-results-full";
import { randomUUID } from "crypto";

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

  const randomSeed = randomUUID();
  const actorId = session.user?.id ?? session.user?.email ?? "unknown";

  let txResult: { draw: { id: string; createdAt: Date }; resultsCount: number };
  try {
    txResult = await db.transaction(async (tx) => {
      const { results } = await runDrawS1(tenantId, { seed: randomSeed, executor: tx });
      const [draw] = await tx
        .insert(draws)
        .values({ tenantId, randomSeed })
        .returning({ id: draws.id, createdAt: draws.createdAt });

      if (!draw) {
        throw new Error("Falha ao criar registro do sorteio");
      }

      if (results.length > 0) {
        await tx.insert(drawResults).values(
          results.map((r) => ({
            tenantId,
            drawId: draw.id,
            apartmentId: r.apartmentId,
            spotId: r.spotId,
          }))
        );
      }

      return { draw, resultsCount: results.length };
    });
  } catch {
    return NextResponse.json(
      { error: "Falha ao executar sorteio" },
      { status: 500 }
    );
  }

  await logAudit(String(actorId), "create", "draw", txResult.draw.id, tenantId, {
    resultCount: txResult.resultsCount,
    randomSeed,
  });

  const resultsWithDetails = await getFullDrawResults(tenantId, txResult.draw.id);

  return NextResponse.json({
    drawId: txResult.draw.id,
    createdAt: txResult.draw.createdAt,
    results: resultsWithDetails,
  });
}
