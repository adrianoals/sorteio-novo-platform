import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { apartments, blocks, parkingSpots, tenants } from "@/db/schema";
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

  const [spotsList, blocksList, apartmentsList] = await Promise.all([
    db
      .select()
      .from(parkingSpots)
      .where(eq(parkingSpots.tenantId, tenantId))
      .orderBy(parkingSpots.number),
    db
      .select()
      .from(blocks)
      .where(eq(blocks.tenantId, tenantId))
      .orderBy(blocks.name),
    db
      .select({
        id: apartments.id,
        number: apartments.number,
        blockId: apartments.blockId,
      })
      .from(apartments)
      .where(eq(apartments.tenantId, tenantId))
      .orderBy(apartments.number),
  ]);

  return NextResponse.json({
    spots: spotsList,
    blocks: blocksList,
    apartments: apartmentsList,
  });
}
