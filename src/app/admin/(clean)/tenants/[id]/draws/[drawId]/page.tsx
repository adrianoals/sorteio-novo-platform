import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { tenants, draws } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getFullDrawResults } from "@/lib/draw-results-full";
import { ViewDrawPageClient } from "./view-draw-page-client";

export default async function ViewDrawPage({
  params,
}: {
  params: Promise<{ id: string; drawId: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login?callbackUrl=/admin/tenants");
  }

  const { id: tenantId, drawId } = await params;
  const [tenant] = await db
    .select({ id: tenants.id, name: tenants.name, slug: tenants.slug })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  if (!tenant) notFound();

  const [draw] = await db
    .select()
    .from(draws)
    .where(and(eq(draws.id, drawId), eq(draws.tenantId, tenantId)))
    .limit(1);
  if (!draw) notFound();

  const results = await getFullDrawResults(tenantId, drawId);

  return (
    <ViewDrawPageClient
      tenantId={tenant.id}
      tenantName={tenant.name}
      tenantSlug={tenant.slug}
      drawId={draw.id}
      createdAt={String(draw.createdAt)}
      results={results}
    />
  );
}
