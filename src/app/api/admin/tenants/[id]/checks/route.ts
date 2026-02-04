import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  tenants,
  blocks,
  apartments,
  parkingSpots,
} from "@/db/schema";
import { eq } from "drizzle-orm";

async function ensureTenant(tenantId: string) {
  const [t] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  return t ?? null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tenantId } = await params;
  const tenant = await ensureTenant(tenantId);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const warnings: string[] = [];
  const errors: string[] = [];

  const aptList = await db
    .select()
    .from(apartments)
    .where(eq(apartments.tenantId, tenantId));
  const spotList = await db
    .select()
    .from(parkingSpots)
    .where(eq(parkingSpots.tenantId, tenantId));

  const totalApts = aptList.length;
  const totalSpots = spotList.length;

  if (totalApts === 0) errors.push("Nenhum apartamento cadastrado.");
  if (totalSpots === 0) errors.push("Nenhuma vaga cadastrada.");

  const config = tenant.config ?? {};
  const hasBlocks = !!config.has_blocks;
  const hasBasement = !!config.has_basement;
  const basements = config.basements ?? [];

  if (hasBlocks) {
    const blockList = await db
      .select({ id: blocks.id })
      .from(blocks)
      .where(eq(blocks.tenantId, tenantId));
    const blockIds = new Set(blockList.map((b) => b.id));

    for (const a of aptList) {
      if (a.blockId && !blockIds.has(a.blockId)) {
        errors.push(`Apartamento "${a.number}" referencia bloco inexistente.`);
      }
    }
    for (const s of spotList) {
      if (s.blockId && !blockIds.has(s.blockId)) {
        errors.push(`Vaga "${s.number}" referencia bloco inexistente.`);
      }
    }
  }

  if (hasBasement && basements.length > 0) {
    const validBasements = new Set(basements);
    for (const s of spotList) {
      if (s.basement && !validBasements.has(s.basement)) {
        warnings.push(
          `Vaga "${s.number}" tem subsolo "${s.basement}" fora da lista configurada.`
        );
      }
    }
  }

  const aptKey = (a: { number: string; blockId: string | null }) =>
    `${a.number}:${a.blockId ?? ""}`;
  const aptKeys = new Map<string, number>();
  for (const a of aptList) {
    const k = aptKey(a);
    aptKeys.set(k, (aptKeys.get(k) ?? 0) + 1);
  }
  for (const [k, count] of aptKeys) {
    if (count > 1) {
      const [num, bl] = k.split(":");
      errors.push(
        `Duplicidade de apartamento: número "${num}"${bl ? ` (bloco)` : ""}.`
      );
    }
  }

  const spotKey = (s: {
    number: string;
    basement: string | null;
    blockId: string | null;
  }) => `${s.number}:${s.basement ?? ""}:${s.blockId ?? ""}`;
  const spotKeys = new Map<string, number>();
  for (const s of spotList) {
    const k = spotKey(s);
    spotKeys.set(k, (spotKeys.get(k) ?? 0) + 1);
  }
  for (const [k, count] of spotKeys) {
    if (count > 1) {
      const [num] = k.split(":");
      errors.push(`Duplicidade de vaga: número "${num}".`);
    }
  }

  const rightsCount: Record<string, number> = {};
  for (const a of aptList) {
    const list = (a.rights ?? []) as string[];
    for (const r of list) {
      rightsCount[r] = (rightsCount[r] ?? 0) + 1;
    }
  }
  const spotTypeCount: Record<string, number> = {};
  for (const s of spotList) {
    spotTypeCount[s.spotType] = (spotTypeCount[s.spotType] ?? 0) + 1;
  }

  const simpleSlots = (rightsCount["simple"] ?? 0) + 2 * (rightsCount["two_simple"] ?? 0) + (rightsCount["double"] ?? 0);
  const simpleSpots = spotTypeCount["simple"] ?? 0;
  const doubleSpots = spotTypeCount["double"] ?? 0;
  const totalProvidedSlots = simpleSpots + doubleSpots;
  if (totalApts > 0 && totalSpots > 0 && totalProvidedSlots < simpleSlots) {
    warnings.push(
      `Direitos (slots) somam ${simpleSlots}, vagas (simples+dupla) somam ${totalProvidedSlots}. Pode faltar vaga para sorteio.`
    );
  }

  const ok = errors.length === 0;
  const okForSimpleDraw =
    ok && totalApts > 0 && totalSpots > 0 && warnings.length === 0;

  return NextResponse.json({
    ok,
    okForSimpleDraw,
    warnings,
    errors,
    counts: {
      apartments: totalApts,
      spots: totalSpots,
      apartmentsByRights: rightsCount,
      spotsByType: spotTypeCount,
    },
  });
}
