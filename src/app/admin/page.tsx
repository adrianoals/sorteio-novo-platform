import Link from "next/link";
import { TenantList } from "./tenant-list";

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-800">Condomínios</h1>
        <Link
          href="/admin/tenants/new"
          className="rounded bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Criar tenant
        </Link>
      </div>
      <TenantList />
    </div>
  );
}
