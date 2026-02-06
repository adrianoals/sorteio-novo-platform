import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { updateTenantSchema } from "@/lib/validations/tenants";
import { logAudit } from "@/lib/audit";
import { and, eq, ne } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, id))
    .limit(1);

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  return NextResponse.json(tenant);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [existing] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateTenantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.slug !== undefined) {
    const normalizedSlug = parsed.data.slug.toLowerCase().trim();
    const conflict = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(and(eq(tenants.slug, normalizedSlug), ne(tenants.id, id)))
      .limit(1);
    if (conflict.length) {
      return NextResponse.json(
        { error: "Slug já está em uso", field: "slug" },
        { status: 409 }
      );
    }
    (parsed.data as { slug?: string }).slug = normalizedSlug;
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) update.name = parsed.data.name;
  if (parsed.data.slug !== undefined) update.slug = parsed.data.slug;
  if (parsed.data.status !== undefined) update.status = parsed.data.status;
  if (parsed.data.config !== undefined) {
    update.config = JSON.parse(JSON.stringify(parsed.data.config)) as Record<string, unknown>;
  }

  const [updated] = await db
    .update(tenants)
    .set(update)
    .where(eq(tenants.id, id))
    .returning();

  const actorId = session.user?.id ?? session.user?.email ?? "unknown";
  await logAudit(String(actorId), "update", "tenant", id, id, update as Record<string, unknown>);

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [existing] = await db
    .select({ id: tenants.id, name: tenants.name })
    .from(tenants)
    .where(eq(tenants.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Condomínio não encontrado" }, { status: 404 });
  }

  const actorId = session.user?.id ?? session.user?.email ?? "unknown";
  await logAudit(String(actorId), "delete", "tenant", id, id, {
    name: existing.name,
  });

  await db.delete(tenants).where(eq(tenants.id, id));

  return new NextResponse(null, { status: 204 });
}
