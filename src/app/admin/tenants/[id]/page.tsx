import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { TenantTabs } from "./tenant-tabs";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await auth();
  const { id } = await params;
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, id))
    .limit(1);
  if (!tenant) notFound();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/admin"
            className="text-sm font-medium text-[#5936CC] hover:text-[#250E62]"
          >
            ← Condomínios
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-[#250E62]">
            {tenant.name}
          </h1>
          <p className="text-sm text-[#5b4d7a]">{tenant.slug}</p>
        </div>
      </div>
      <TenantTabs tenant={tenant} />
    </div>
  );
}
