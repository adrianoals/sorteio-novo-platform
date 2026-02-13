import { notFound } from "next/navigation";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SorteioPageClient } from "./sorteio-page-client";

export default async function SorteioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [tenant] = await db
    .select({ id: tenants.id, name: tenants.name, slug: tenants.slug })
    .from(tenants)
    .where(eq(tenants.id, id))
    .limit(1);
  if (!tenant) notFound();

  return (
    <SorteioPageClient
      tenantId={tenant.id}
      tenantName={tenant.name}
      tenantSlug={tenant.slug}
    />
  );
}
