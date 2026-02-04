import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { apartments } from "@/db/schema";
import { updateApartmentSchema } from "@/lib/validations/apartments";
import { logAudit } from "@/lib/audit";
import { and, eq, isNull, ne } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; apartmentId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tenantId, apartmentId } = await params;
  const [existing] = await db
    .select()
    .from(apartments)
    .where(
      and(
        eq(apartments.id, apartmentId),
        eq(apartments.tenantId, tenantId)
      )
    )
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Apartment not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateApartmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const number = parsed.data.number ?? existing.number;
  const blockId = parsed.data.blockId !== undefined ? parsed.data.blockId : existing.blockId;
  const dupCondition = blockId
    ? and(
        eq(apartments.tenantId, tenantId),
        eq(apartments.number, number),
        eq(apartments.blockId, blockId),
        ne(apartments.id, apartmentId)
      )
    : and(
        eq(apartments.tenantId, tenantId),
        eq(apartments.number, number),
        isNull(apartments.blockId),
        ne(apartments.id, apartmentId)
      );
  const duplicate = await db
    .select({ id: apartments.id })
    .from(apartments)
    .where(dupCondition)
    .limit(1);
  if (duplicate.length) {
    return NextResponse.json(
      { error: "Já existe apartamento com este número (e bloco).", field: "number" },
      { status: 409 }
    );
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.number !== undefined) update.number = parsed.data.number;
  if (parsed.data.blockId !== undefined) update.blockId = parsed.data.blockId ?? null;
  if (parsed.data.rights !== undefined) update.rights = parsed.data.rights;
  if (parsed.data.allowedSubsolos !== undefined) update.allowedSubsolos = parsed.data.allowedSubsolos ?? null;
  if (parsed.data.allowedBlocks !== undefined) update.allowedBlocks = parsed.data.allowedBlocks ?? null;
  if (parsed.data.attributes !== undefined) update.attributes = parsed.data.attributes ?? null;

  const [updated] = await db
    .update(apartments)
    .set(update)
    .where(eq(apartments.id, apartmentId))
    .returning();

  const actorId = session.user?.id ?? session.user?.email ?? "unknown";
  await logAudit(String(actorId), "update", "apartment", apartmentId, tenantId, update as Record<string, unknown>);

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; apartmentId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tenantId, apartmentId } = await params;
  const [existing] = await db
    .select({ id: apartments.id })
    .from(apartments)
    .where(
      and(
        eq(apartments.id, apartmentId),
        eq(apartments.tenantId, tenantId)
      )
    )
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Apartment not found" }, { status: 404 });
  }

  await db.delete(apartments).where(eq(apartments.id, apartmentId));
  const actorId = session.user?.id ?? session.user?.email ?? "unknown";
  await logAudit(String(actorId), "delete", "apartment", apartmentId, tenantId);
  return new NextResponse(null, { status: 204 });
}
