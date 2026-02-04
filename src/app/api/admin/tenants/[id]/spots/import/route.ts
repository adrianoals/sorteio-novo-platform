import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { tenants, parkingSpots, blocks } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import {
  parseSpotCsvRaw,
  parseSpotXlsxRaw,
  mapRawRowToSpotRow,
  validateSpotRow,
  type SpotRow,
  type SpotConfig,
  type BlockInfo,
} from "@/lib/import-spots";
import { logAudit } from "@/lib/audit";

async function getTenant(tenantId: string) {
  const [t] = await db
    .select({ id: tenants.id, config: tenants.config })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  return t ?? null;
}

function getBlocks(tenantId: string): Promise<BlockInfo[]> {
  return db
    .select({ id: blocks.id, name: blocks.name, code: blocks.code })
    .from(blocks)
    .where(eq(blocks.tenantId, tenantId))
    .orderBy(blocks.name);
}

function getRawRows(
  buffer: Buffer,
  contentType: string,
  filename: string
): Record<string, string>[] {
  const fn = filename.toLowerCase();
  const isXlsx = fn.endsWith(".xlsx") || fn.endsWith(".xls") || buffer[0] === 0x50;
  if (isXlsx) return parseSpotXlsxRaw(buffer);
  return parseSpotCsvRaw(buffer);
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
  const tenant = await getTenant(tenantId);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }
  const config = (tenant.config as SpotConfig | null) ?? {};
  const hasBlocks = !!config.has_blocks;
  const hasBasement = !!config.has_basement;
  const blocksList = await getBlocks(tenantId);

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Envie um arquivo (file)" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || "";
  const filename = file.name || "";
  const rawRows = getRawRows(buffer, contentType, filename);
  const rows: SpotRow[] = rawRows
    .map((raw) => mapRawRowToSpotRow(raw, config, blocksList))
    .filter((r) => r.number.trim() !== "");

  const errors: { row: number; reason: string }[] = [];
  let inserted = 0;
  let rejected = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const validated = validateSpotRow(row, i + 1);
    if (!validated.ok) {
      errors.push({ row: validated.row, reason: validated.reason });
      rejected++;
      continue;
    }
    if (hasBasement && !(row.basement ?? "").trim()) {
      errors.push({ row: i + 1, reason: "Localização é obrigatória quando o condomínio usa localização" });
      rejected++;
      continue;
    }
    if (hasBlocks && !(row.block_id ?? "").trim()) {
      errors.push({ row: i + 1, reason: "Bloco é obrigatório quando o condomínio usa blocos" });
      rejected++;
      continue;
    }

    const basement = (row.basement ?? "").trim() || null;
    const blockId = (row.block_id ?? "").trim() || null;
    const basementCond =
      basement != null && basement !== ""
        ? eq(parkingSpots.basement, basement)
        : isNull(parkingSpots.basement);
    const blockIdCond = blockId
      ? eq(parkingSpots.blockId, blockId)
      : isNull(parkingSpots.blockId);
    const existing = await db
      .select({ id: parkingSpots.id })
      .from(parkingSpots)
      .where(
        and(
          eq(parkingSpots.tenantId, tenantId),
          eq(parkingSpots.number, row.number),
          basementCond,
          blockIdCond
        )
      )
      .limit(1);

    if (existing.length) {
      errors.push({ row: i + 1, reason: "Duplicado (número + localização/bloco)" });
      rejected++;
      continue;
    }

    await db.insert(parkingSpots).values({
      tenantId,
      number: row.number,
      blockId,
      basement,
      spotType: row.spot_type as "simple" | "double",
      specialType: (row.special_type as "normal" | "pne" | "idoso" | "visitor") || "normal",
    });
    inserted++;
  }

  const actorId = session.user?.id ?? session.user?.email ?? "unknown";
  await logAudit(String(actorId), "import", "spot", tenantId, tenantId, {
    inserted,
    updated: 0,
    rejected,
    errorCount: errors.length,
  });

  return NextResponse.json({
    inserted,
    updated: 0,
    rejected,
    errors,
  });
}
