import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { tenants, apartments } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import {
  parseApartmentCsv,
  parseApartmentXlsx,
  validateApartmentRow,
  type ApartmentRow,
} from "@/lib/import-apartments";
import { logAudit } from "@/lib/audit";

async function getTenant(tenantId: string) {
  const [t] = await db
    .select({ id: tenants.id, config: tenants.config })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  return t ?? null;
}

function getRows(buffer: Buffer, contentType: string, filename: string): ApartmentRow[] {
  const fn = filename.toLowerCase();
  const isXlsx = fn.endsWith(".xlsx") || fn.endsWith(".xls") || buffer[0] === 0x50;
  if (isXlsx) return parseApartmentXlsx(buffer);
  return parseApartmentCsv(buffer);
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
  const hasBlocks = !!(tenant.config as { has_blocks?: boolean } | null)?.has_blocks;

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
  const rows = getRows(buffer, contentType, filename);

  const errors: { row: number; reason: string }[] = [];
  let inserted = 0;
  let rejected = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const validated = validateApartmentRow(row, i + 1);
    if (!validated.ok) {
      errors.push({ row: validated.row, reason: validated.reason });
      rejected++;
      continue;
    }
    if (hasBlocks && !(row.block_id ?? "").trim()) {
      errors.push({ row: i + 1, reason: "Bloco é obrigatório quando o condomínio usa blocos" });
      rejected++;
      continue;
    }

    const blockId = (row.block_id ?? "").trim() || null;
    const dupCondition = blockId
      ? and(
          eq(apartments.tenantId, tenantId),
          eq(apartments.number, row.number),
          eq(apartments.blockId, blockId)
        )
      : and(
          eq(apartments.tenantId, tenantId),
          eq(apartments.number, row.number),
          isNull(apartments.blockId)
        );
    const existing = await db
      .select({ id: apartments.id })
      .from(apartments)
      .where(dupCondition)
      .limit(1);

    if (existing.length) {
      errors.push({ row: i + 1, reason: "Duplicado (número + bloco)" });
      rejected++;
      continue;
    }

    await db.insert(apartments).values({
      tenantId,
      number: row.number,
      blockId,
      rights: row.rights as ("simple" | "double" | "two_simple" | "car" | "moto")[],
      allowedSubsolos:
        row.allowed_subsolos && row.allowed_subsolos.length > 0 ? row.allowed_subsolos : undefined,
      allowedBlocks:
        row.allowed_blocks && row.allowed_blocks.length > 0 ? row.allowed_blocks : undefined,
    });
    inserted++;
  }

  const actorId = session.user?.id ?? session.user?.email ?? "unknown";
  await logAudit(String(actorId), "import", "apartment", tenantId, tenantId, {
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
