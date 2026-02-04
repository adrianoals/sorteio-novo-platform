import Link from "next/link";
import { TenantList } from "./tenant-list";

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#250E62]">Condomínios</h1>
        <Link
          href="/admin/tenants/new"
          className="rounded bg-[#250E62] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e0b4f] transition-colors"
        >
          Novo condomínio
        </Link>
      </div>
      <TenantList />
    </div>
  );
}
