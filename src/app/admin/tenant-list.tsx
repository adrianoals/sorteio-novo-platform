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
    return <p className="text-zinc-500">Carregando…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Buscar por nome ou slug"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="">Todos</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
        </select>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-4 py-3 font-medium text-zinc-700">Nome</th>
              <th className="px-4 py-3 font-medium text-zinc-700">Slug</th>
              <th className="px-4 py-3 font-medium text-zinc-700">Status</th>
              <th className="px-4 py-3 font-medium text-zinc-700" />
            </tr>
          </thead>
          <tbody>
            {tenants.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                  Nenhum condomínio encontrado.
                </td>
              </tr>
            ) : (
              tenants.map((t) => (
                <tr key={t.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="px-4 py-3 text-zinc-800">{t.name}</td>
                  <td className="px-4 py-3 text-zinc-600">{t.slug}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        t.status === "active"
                          ? "text-emerald-600"
                          : "text-zinc-500"
                      }
                    >
                      {t.status === "active" ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/tenants/${t.id}`}
                      className="text-zinc-600 hover:text-zinc-800 underline"
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
