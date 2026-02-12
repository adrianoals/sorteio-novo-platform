import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  tenants,
  draws,
  drawResults,
  apartments,
  parkingSpots,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { logAudit } from "@/lib/audit";

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
  { params }: { params: Promise<{ id: string; drawId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tenantId, drawId } = await params;
  if (!(await ensureTenant(tenantId))) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const [draw] = await db
    .select()
    .from(draws)
    .where(and(eq(draws.id, drawId), eq(draws.tenantId, tenantId)))
    .limit(1);

  if (!draw) {
    return NextResponse.json({ error: "Sorteio não encontrado" }, { status: 404 });
  }

  const results = await db
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
    .where(and(eq(drawResults.drawId, drawId), eq(drawResults.tenantId, tenantId)));

  return NextResponse.json({
    id: draw.id,
    createdAt: draw.createdAt,
    results,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; drawId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id: tenantId, drawId } = await params;
  if (!tenantId || !drawId) {
    return NextResponse.json(
      { error: "Dados inválidos" },
      { status: 400 }
    );
  }

  if (!(await ensureTenant(tenantId))) {
    return NextResponse.json({ error: "Condomínio não encontrado" }, { status: 404 });
  }

  const [draw] = await db
    .select()
    .from(draws)
    .where(and(eq(draws.id, drawId), eq(draws.tenantId, tenantId)))
    .limit(1);

  if (!draw) {
    return NextResponse.json(
      { error: "Sorteio não encontrado" },
      { status: 404 }
    );
  }

  try {
    await db
      .delete(drawResults)
      .where(and(eq(drawResults.drawId, drawId), eq(drawResults.tenantId, tenantId)));
    await db.delete(draws).where(eq(draws.id, drawId));
  } catch (err) {
    console.error("Delete draw error:", err);
    return NextResponse.json(
      { error: "Erro ao excluir o sorteio" },
      { status: 500 }
    );
  }

  const actorId = session.user?.id ?? session.user?.email ?? "unknown";
  await logAudit(String(actorId), "delete", "draw", drawId, tenantId, {});

  return NextResponse.json({ ok: true });
}
