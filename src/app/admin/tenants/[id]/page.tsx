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
            className="text-sm text-zinc-600 hover:text-zinc-800"
          >
            ← Condomínios
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-800">
            {tenant.name}
          </h1>
          <p className="text-sm text-zinc-500">{tenant.slug}</p>
        </div>
      </div>
      <TenantTabs tenant={tenant} />
    </div>
  );
}
