import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { blocks } from "@/db/schema";
import { updateBlockSchema } from "@/lib/validations/blocks";
import { logAudit } from "@/lib/audit";
import { and, eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; blockId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tenantId, blockId } = await params;
  const [existing] = await db
    .select()
    .from(blocks)
    .where(and(eq(blocks.id, blockId), eq(blocks.tenantId, tenantId)))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateBlockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) update.name = parsed.data.name;
  if (parsed.data.code !== undefined) update.code = parsed.data.code;

  const [updated] = await db
    .update(blocks)
    .set(update)
    .where(eq(blocks.id, blockId))
    .returning();

  const actorId = session.user?.id ?? session.user?.email ?? "unknown";
  await logAudit(String(actorId), "update", "block", blockId, existing.tenantId, update as Record<string, unknown>);

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; blockId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tenantId, blockId } = await params;
  const [existing] = await db
    .select({ id: blocks.id })
    .from(blocks)
    .where(and(eq(blocks.id, blockId), eq(blocks.tenantId, tenantId)))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  await db.delete(blocks).where(eq(blocks.id, blockId));
  const actorId = session.user?.id ?? session.user?.email ?? "unknown";
  await logAudit(String(actorId), "delete", "block", blockId, tenantId);
  return new NextResponse(null, { status: 204 });
}
