import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { createTenantSchema } from "@/lib/validations/tenants";
import { logAudit } from "@/lib/audit";
import { and, eq, ilike, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const status = searchParams.get("status")?.trim();

  const conditions = [];
  if (status === "active" || status === "inactive") {
    conditions.push(eq(tenants.status, status));
  }
  if (search) {
    conditions.push(
      or(
        ilike(tenants.name, `%${search}%`),
        ilike(tenants.slug, `%${search}%`)
      )!
    );
  }

  const list = await db
    .select()
    .from(tenants)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(tenants.name);

  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const parsed = createTenantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, slug } = parsed.data;
  const normalizedSlug = slug.toLowerCase().trim();

  const existing = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, normalizedSlug))
    .limit(1);

  if (existing.length) {
    return NextResponse.json(
      { error: "Slug já está em uso", field: "slug" },
      { status: 409 }
    );
  }

  const [created] = await db
    .insert(tenants)
    .values({ name, slug: normalizedSlug, status: "active" })
    .returning();

  const actorId = session.user?.id ?? session.user?.email ?? "unknown";
  await logAudit(
    String(actorId),
    "create",
    "tenant",
    created!.id,
    created!.id,
    { name: created!.name, slug: created!.slug }
  );

  return NextResponse.json(created, { status: 201 });
}
