import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { apartments, parkingSpots } from "@/db/schema";
import { updateSpotSchema } from "@/lib/validations/spots";
import { logAudit } from "@/lib/audit";
import { and, eq, isNull, ne } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; spotId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tenantId, spotId } = await params;
  const [existing] = await db
    .select()
    .from(parkingSpots)
    .where(
      and(
        eq(parkingSpots.id, spotId),
        eq(parkingSpots.tenantId, tenantId)
      )
    )
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Spot not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSpotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const number = parsed.data.number ?? existing.number;
  const blockId = parsed.data.blockId !== undefined ? parsed.data.blockId : existing.blockId;
  const basement = parsed.data.basement !== undefined ? parsed.data.basement : existing.basement;
  const basementCond = basement != null && basement !== ""
    ? eq(parkingSpots.basement, basement)
    : isNull(parkingSpots.basement);
  const blockIdCond = blockId
    ? eq(parkingSpots.blockId, blockId)
    : isNull(parkingSpots.blockId);
  const duplicate = await db
    .select({ id: parkingSpots.id })
    .from(parkingSpots)
    .where(
      and(
        eq(parkingSpots.tenantId, tenantId),
        eq(parkingSpots.number, number),
        basementCond,
        blockIdCond,
        ne(parkingSpots.id, spotId)
      )
    )
    .limit(1);
  if (duplicate.length) {
    return NextResponse.json(
      { error: "Já existe vaga com este número (e localização/bloco).", field: "number" },
      { status: 409 }
    );
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.number !== undefined) update.number = parsed.data.number;
  if (parsed.data.blockId !== undefined) update.blockId = parsed.data.blockId ?? null;
  if (parsed.data.basement !== undefined) update.basement = parsed.data.basement ?? null;
  if (parsed.data.spotType !== undefined) update.spotType = parsed.data.spotType;
  if (parsed.data.specialType !== undefined) update.specialType = parsed.data.specialType ?? null;
  if (parsed.data.attributes !== undefined) update.attributes = parsed.data.attributes ?? null;

  if (parsed.data.apartmentId !== undefined) {
    const newApartmentId = parsed.data.apartmentId ?? null;
    if (newApartmentId) {
      const [apt] = await db
        .select({ id: apartments.id, rights: apartments.rights })
        .from(apartments)
        .where(
          and(
            eq(apartments.id, newApartmentId),
            eq(apartments.tenantId, tenantId)
          )
        )
        .limit(1);
      if (!apt) {
        return NextResponse.json({ error: "Apartamento não encontrado." }, { status: 404 });
      }
      const rights = (apt.rights ?? []) as string[];
      const spotType = parsed.data.spotType ?? existing.spotType;
      const compatible =
        spotType === "simple"
          ? rights.some((r) => r === "simple" || r === "two_simple")
          : spotType === "double"
            ? rights.includes("double")
            : false;
      if (!compatible) {
        return NextResponse.json(
          { error: "O apartamento não tem direito a este tipo de vaga (simples/dupla)." },
          { status: 400 }
        );
      }
    }
    update.apartmentId = newApartmentId;
  }

  const [updated] = await db
    .update(parkingSpots)
    .set(update)
    .where(eq(parkingSpots.id, spotId))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; spotId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tenantId, spotId } = await params;
  const [existing] = await db
    .select({ id: parkingSpots.id })
    .from(parkingSpots)
    .where(
      and(
        eq(parkingSpots.id, spotId),
        eq(parkingSpots.tenantId, tenantId)
      )
    )
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Spot not found" }, { status: 404 });
  }

  await db.delete(parkingSpots).where(eq(parkingSpots.id, spotId));
  const actorId = session.user?.id ?? session.user?.email ?? "unknown";
  await logAudit(String(actorId), "delete", "spot", spotId, tenantId);
  return new NextResponse(null, { status: 204 });
}
