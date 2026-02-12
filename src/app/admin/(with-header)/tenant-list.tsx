"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [deleteModal, setDeleteModal] = useState<Tenant | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    return fetch(`/api/admin/tenants?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setTenants(Array.isArray(data) ? data : []);
      })
      .catch(() => setTenants([]));
  }, [search, statusFilter]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  async function confirmExcluir() {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/tenants/${deleteModal.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setDeleteModal(null);
        setLoading(true);
        try {
          await load();
        } finally {
          setLoading(false);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Não foi possível excluir o condomínio. Tente novamente.");
      }
    } catch {
      alert("Erro de conexão ao excluir.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <p className="text-[#5b4d7a]">Carregando…</p>;
  }

  return (
    <div className="space-y-4">
      {deleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) =>
            e.target === e.currentTarget && !deleting && setDeleteModal(null)
          }
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-tenant-title"
        >
          <div
            className="bg-white rounded-xl shadow-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 id="delete-tenant-title" className="font-medium text-[#250E62] mb-2">
              Excluir condomínio
            </h4>
            <p className="text-[#5b4d7a] mb-4">
              Tem certeza que deseja excluir o condomínio <strong>{deleteModal.name}</strong>?
              Esta ação não pode ser desfeita e removerá todos os dados do condomínio
              (sorteios, apartamentos, vagas, blocos, etc.).
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => !deleting && setDeleteModal(null)}
                disabled={!!deleting}
                className="rounded border border-[#e2deeb] px-4 py-2 text-sm text-[#3F228D] hover:bg-[#faf9ff] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmExcluir}
                disabled={!!deleting}
                className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Excluindo…" : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

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
              <th className="px-4 py-3 font-medium text-[#3F228D]">Ações</th>
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
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/tenants/${t.id}`}
                        className="font-medium text-[#5936CC] hover:text-[#250E62]"
                      >
                        Ver
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleteModal(t)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Excluir
                      </button>
                    </div>
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
