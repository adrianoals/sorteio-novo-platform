import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { tenants, draws } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export default async function ResultadoUltimoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (slug === "admin") notFound();

  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  if (!tenant) notFound();

  const [lastDraw] = await db
    .select({ id: draws.id })
    .from(draws)
    .where(eq(draws.tenantId, tenant.id))
    .orderBy(desc(draws.createdAt))
    .limit(1);

  if (!lastDraw) notFound();

  redirect(`/${slug}/resultado/${lastDraw.id}`);
}
