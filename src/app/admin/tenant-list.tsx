"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Tenant = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

export function TenantList() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/admin/tenants?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setTenants(Array.isArray(data) ? data : []);
      })
      .catch(() => setTenants([]))
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  if (loading) {
    return <p className="text-[#5b4d7a]">Carregando…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Buscar por nome ou slug"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded border border-[#e2deeb] bg-white px-3 py-2 text-sm text-[#1a0d2e] placeholder:text-[#9b8fb5] focus:border-[#5936CC] focus:outline-none focus:ring-1 focus:ring-[#5936CC]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded border border-[#e2deeb] bg-white px-3 py-2 text-sm text-[#1a0d2e] focus:border-[#5936CC] focus:outline-none"
        >
          <option value="">Todos</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
        </select>
      </div>
      <div className="rounded-lg border border-[#e2deeb] bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#faf9ff] border-b border-[#e2deeb]">
            <tr>
              <th className="px-4 py-3 font-medium text-[#3F228D]">Nome</th>
              <th className="px-4 py-3 font-medium text-[#3F228D]">Slug</th>
              <th className="px-4 py-3 font-medium text-[#3F228D]">Status</th>
              <th className="px-4 py-3 font-medium text-[#3F228D]" />
            </tr>
          </thead>
          <tbody>
            {tenants.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-[#5b4d7a]">
                  Nenhum condomínio encontrado.
                </td>
              </tr>
            ) : (
              tenants.map((t) => (
                <tr key={t.id} className="border-b border-[#e2deeb] hover:bg-[#faf9ff]">
                  <td className="px-4 py-3 font-medium text-[#1a0d2e]">{t.name}</td>
                  <td className="px-4 py-3 text-[#5b4d7a]">{t.slug}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        t.status === "active"
                          ? "text-emerald-600"
                          : "text-[#5b4d7a]"
                      }
                    >
                      {t.status === "active" ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/tenants/${t.id}`}
                      className="font-medium text-[#5936CC] hover:text-[#250E62]"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
