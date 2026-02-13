import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { apartments, blocks } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tenantId } = await params;

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

  return NextResponse.json(
    { apartments: apartmentsList, blocks: blocksList },
    {
      headers: {
        "Cache-Control": "private, s-maxage=30, stale-while-revalidate=60",
      },
    }
  );
}
