import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SorteioPageClient } from "./sorteio-page-client";

export default async function SorteioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login?callbackUrl=/admin/tenants");
  }

  const { id } = await params;
  const [tenant] = await db
    .select({ id: tenants.id, name: tenants.name, slug: tenants.slug })
    .from(tenants)
    .where(eq(tenants.id, id))
    .limit(1);
  if (!tenant) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/admin/tenants/${tenant.id}`}
          className="text-sm font-medium text-[#5936CC] hover:text-[#250E62]"
        >
          ← {tenant.name}
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-[#250E62]">
          Sorteio de Vagas — {tenant.name}
        </h1>
      </div>
      <SorteioPageClient
        tenantId={tenant.id}
        tenantName={tenant.name}
        tenantSlug={tenant.slug}
      />
    </div>
  );
}
