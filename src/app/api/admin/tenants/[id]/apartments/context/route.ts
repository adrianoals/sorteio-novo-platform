import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { apartments, blocks, tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

async function ensureTenant(tenantId: string) {
  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  return tenant ?? null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tenantId } = await params;
  if (!(await ensureTenant(tenantId))) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const [apartmentsList, blocksList] = await Promise.all([
    db
      .select()
      .from(apartments)
      .where(eq(apartments.tenantId, tenantId))
      .orderBy(apartments.number),
    db
      .select()
      .from(blocks)
      .where(eq(blocks.tenantId, tenantId))
      .orderBy(blocks.name),
  ]);

  return NextResponse.json({
    apartments: apartmentsList,
    blocks: blocksList,
  });
}
