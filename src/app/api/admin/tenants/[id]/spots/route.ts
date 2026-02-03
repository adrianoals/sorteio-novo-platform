import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { tenants, parkingSpots } from "@/db/schema";
import { createSpotSchema } from "@/lib/validations/spots";
import { logAudit } from "@/lib/audit";
import { and, eq, isNull } from "drizzle-orm";

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
    .select()
    .from(parkingSpots)
    .where(eq(parkingSpots.tenantId, tenantId))
    .orderBy(parkingSpots.number);
  return NextResponse.json(list);
}

export async function POST(
  req: NextRequest,
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSpotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { number, blockId, basement, spotType, specialType, attributes } = parsed.data;
  const baseConditions = [
    eq(parkingSpots.tenantId, tenantId),
    eq(parkingSpots.number, number),
  ];
  const basementCond = basement != null && basement !== ""
    ? eq(parkingSpots.basement, basement)
    : isNull(parkingSpots.basement);
  const blockIdCond = blockId
    ? eq(parkingSpots.blockId, blockId)
    : isNull(parkingSpots.blockId);
  const existing = await db
    .select({ id: parkingSpots.id })
    .from(parkingSpots)
    .where(and(...baseConditions, basementCond, blockIdCond))
    .limit(1);
  if (existing.length) {
    return NextResponse.json(
      { error: "Já existe vaga com este número (e subsolo/bloco).", field: "number" },
      { status: 409 }
    );
  }

  const [created] = await db
    .insert(parkingSpots)
    .values({
      tenantId,
      number,
      blockId: blockId ?? null,
      basement: basement ?? null,
      spotType,
      specialType: specialType ?? "normal",
      attributes: attributes ?? null,
    })
    .returning();

  const actorId = session.user?.id ?? session.user?.email ?? "unknown";
  await logAudit(String(actorId), "create", "spot", created!.id, tenantId, {
    number: created!.number,
    spotType: created!.spotType,
  });

  return NextResponse.json(created, { status: 201 });
}
