import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  tenants,
  draws,
  drawResults,
  apartments,
  parkingSpots,
  blocks,
} from "@/db/schema";
import type { TenantConfig } from "@/db/schema/tenants";
import { and, eq, asc } from "drizzle-orm";
import ExcelJS from "exceljs";

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

/** Ordem padrão: Apartamento, [Bloco], Vaga, [Localização], Tipo, Especial */
function buildColumnKeys(config: TenantConfig | null | undefined) {
  const hasBlocks = !!config?.has_blocks;
  const hasBasement = !!config?.has_basement;
  const keys: Array<"Apartamento" | "Bloco" | "Vaga" | "Localização" | "Tipo" | "Especial"> = [
    "Apartamento",
    ...(hasBlocks ? (["Bloco"] as const) : []),
    "Vaga",
    ...(hasBasement ? (["Localização"] as const) : []),
    "Tipo",
    "Especial",
  ];
  return keys;
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

  const [tenant] = await db
    .select({ id: tenants.id, name: tenants.name, config: tenants.config })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) {
    return NextResponse.json({ error: "Condomínio não encontrado" }, { status: 404 });
  }

  const [draw] = await db
    .select()
    .from(draws)
    .where(and(eq(draws.id, drawId), eq(draws.tenantId, tenantId)))
    .limit(1);

  if (!draw) {
    return NextResponse.json({ error: "Sorteio não encontrado" }, { status: 404 });
  }

  const config = tenant.config as TenantConfig | null | undefined;
  const columnKeys = buildColumnKeys(config);

  const results = await db
    .select({
      apartmentNumber: apartments.number,
      blockName: blocks.name,
      spotNumber: parkingSpots.number,
      spotBasement: parkingSpots.basement,
      spotType: parkingSpots.spotType,
      spotSpecialType: parkingSpots.specialType,
    })
    .from(drawResults)
    .innerJoin(apartments, eq(drawResults.apartmentId, apartments.id))
    .leftJoin(blocks, eq(apartments.blockId, blocks.id))
    .innerJoin(parkingSpots, eq(drawResults.spotId, parkingSpots.id))
    .where(eq(drawResults.drawId, drawId))
    .orderBy(asc(apartments.number));

  const hasBlocks = !!config?.has_blocks;
  const hasBasement = !!config?.has_basement;

  const rows = results.map((r) => {
    const row: Record<string, string> = {
      Apartamento: r.apartmentNumber,
      Vaga: r.spotNumber,
      Tipo: SPOT_TYPE_LABELS[r.spotType] ?? r.spotType,
      Especial: SPECIAL_LABELS[r.spotSpecialType ?? "normal"] ?? r.spotSpecialType,
    };
    if (hasBlocks) row.Bloco = r.blockName ?? "—";
    if (hasBasement) row["Localização"] = r.spotBasement ?? "—";
    return row;
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sorteio Novo";
  const sheet = workbook.addWorksheet("Resultado", { views: [{ state: "frozen", ySplit: 6 }] });

  const createdAt = new Date(draw.createdAt);
  const dateFormatted = createdAt.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  sheet.getCell("A1").value = "Sorteio Novo";
  sheet.getCell("A1").font = { bold: true, size: 12 };
  sheet.mergeCells(1, 1, 1, columnKeys.length);

  sheet.getCell("A2").value = "Resultado do Sorteio de Vagas";
  sheet.getCell("A2").font = { bold: true, size: 14 };
  sheet.mergeCells(2, 1, 2, columnKeys.length);

  sheet.getCell("A3").value = tenant.name;
  sheet.getCell("A3").font = { size: 11 };

  sheet.getCell("A4").value = `Sorteio realizado em: ${dateFormatted}`;
  sheet.getCell("A4").font = { size: 10 };

  const headerRowIndex = 6;
  columnKeys.forEach((key, i) => {
    const cell = sheet.getCell(headerRowIndex, i + 1);
    cell.value = key;
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE2DEEB" },
    };
    cell.alignment = { vertical: "middle" };
  });

  rows.forEach((row, rowIndex) => {
    const r = headerRowIndex + 1 + rowIndex;
    columnKeys.forEach((key, colIndex) => {
      const cell = sheet.getCell(r, colIndex + 1);
      cell.value = row[key] ?? "";
      cell.alignment = { vertical: "middle" };
    });
  });

  const dataEndRow = headerRowIndex + rows.length;
  const colCount = columnKeys.length;
  for (let row = headerRowIndex; row <= dataEndRow; row++) {
    for (let col = 1; col <= colCount; col++) {
      const cell = sheet.getCell(row, col);
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }
  }

  sheet.columns = columnKeys.map(() => ({ width: 18 }));

  const buf = await workbook.xlsx.writeBuffer();
  const dateStr = createdAt.toISOString().slice(0, 10);
  const safeName = tenant.name.replace(/[^a-zA-Z0-9\s-_]/g, "").replace(/\s+/g, "_").slice(0, 40);
  const filename = `sorteio_${safeName}_${dateStr}.xlsx`;

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
