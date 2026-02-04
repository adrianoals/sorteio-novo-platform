import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  tenants,
  draws,
  drawResults,
  apartments,
  parkingSpots,
} from "@/db/schema";
import { and, eq, asc } from "drizzle-orm";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const XLSX = require("xlsx");

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
  { params }: { params: Promise<{ id: string; drawId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tenantId, drawId } = await params;
  if (!(await ensureTenant(tenantId))) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const [draw] = await db
    .select()
    .from(draws)
    .where(and(eq(draws.id, drawId), eq(draws.tenantId, tenantId)))
    .limit(1);

  if (!draw) {
    return NextResponse.json({ error: "Sorteio não encontrado" }, { status: 404 });
  }

  const results = await db
    .select({
      apartmentNumber: apartments.number,
      spotNumber: parkingSpots.number,
      spotBasement: parkingSpots.basement,
      spotType: parkingSpots.spotType,
      spotSpecialType: parkingSpots.specialType,
    })
    .from(drawResults)
    .innerJoin(apartments, eq(drawResults.apartmentId, apartments.id))
    .innerJoin(parkingSpots, eq(drawResults.spotId, parkingSpots.id))
    .where(eq(drawResults.drawId, drawId))
    .orderBy(asc(apartments.number));

  const SPOT_TYPE_LABELS: Record<string, string> = {
    simple: "Simples",
    double: "Dupla",
  };
  const SPECIAL_LABELS: Record<string, string> = {
    normal: "Normal",
    pne: "PNE",
    idoso: "Idoso",
    visitor: "Visitante",
  };

  const rows = results.map((r) => ({
    Apartamento: r.apartmentNumber,
    Vaga: r.spotNumber,
    Localização: r.spotBasement ?? "",
    Tipo: SPOT_TYPE_LABELS[r.spotType] ?? r.spotType,
    Especial: SPECIAL_LABELS[r.spotSpecialType ?? "normal"] ?? r.spotSpecialType,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Resultado");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const createdAt = new Date(draw.createdAt);
  const dateStr = createdAt.toISOString().slice(0, 10);
  const filename = `sorteio_${dateStr}.xlsx`;

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
