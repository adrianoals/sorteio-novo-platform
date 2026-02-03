import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { tenants, apartments } from "@/db/schema";
import { createApartmentSchema } from "@/lib/validations/apartments";
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
    .from(apartments)
    .where(eq(apartments.tenantId, tenantId))
    .orderBy(apartments.number);
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

  const parsed = createApartmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { number, blockId, rights, attributes } = parsed.data;
  const dupCondition = blockId
    ? and(
        eq(apartments.tenantId, tenantId),
        eq(apartments.number, number),
        eq(apartments.blockId, blockId)
      )
    : and(
        eq(apartments.tenantId, tenantId),
        eq(apartments.number, number),
        isNull(apartments.blockId)
      );
  const existing = await db
    .select({ id: apartments.id })
    .from(apartments)
    .where(dupCondition)
    .limit(1);
  if (existing.length) {
    return NextResponse.json(
      { error: "Já existe apartamento com este número (e bloco).", field: "number" },
      { status: 409 }
    );
  }

  const [created] = await db
    .insert(apartments)
    .values({
      tenantId,
      number,
      blockId: blockId ?? null,
      rights,
      attributes: attributes ?? null,
    })
    .returning();

  const actorId = session.user?.id ?? session.user?.email ?? "unknown";
  await logAudit(String(actorId), "create", "apartment", created!.id, tenantId, {
    number: created!.number,
    rights: created!.rights,
  });

  return NextResponse.json(created, { status: 201 });
}
