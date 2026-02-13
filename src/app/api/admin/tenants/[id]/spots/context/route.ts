import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { apartments, blocks, parkingSpots } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tenantId } = await params;

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

  return NextResponse.json(
    { spots: spotsList, blocks: blocksList, apartments: apartmentsList },
    {
      headers: {
        "Cache-Control": "private, s-maxage=30, stale-while-revalidate=60",
      },
    }
  );
}
