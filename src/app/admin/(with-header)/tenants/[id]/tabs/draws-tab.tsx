"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DrawItem = {
  id: string;
  createdAt: string;
  resultCount: number;
};

export function DrawsTab({ tenantId }: { tenantId: string }) {
  const [draws, setDraws] = useState<DrawItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    return fetch(`/api/admin/tenants/${tenantId}/draws`)
      .then((r) => r.json())
      .then((data) => setDraws(Array.isArray(data) ? data : []))
      .catch(() => setDraws([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [tenantId]);

  function handleExcluir(drawId: string) {
    if (!confirm("Excluir este sorteio? Esta ação não pode ser desfeita.")) return;
    setDeletingId(drawId);
    fetch(`/api/admin/tenants/${tenantId}/draws/${drawId}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then(async (r) => {
        if (r.ok) {
          await load();
        } else {
          const data = await r.json().catch(() => ({}));
          alert(data.error ?? "Não foi possível excluir o sorteio. Tente novamente.");
        }
      })
      .catch(() => {
        alert("Erro de conexão ao excluir.");
      })
      .finally(() => setDeletingId(null));
  }

  const formatDate = (createdAt: string) => {
    try {
      return new Date(createdAt).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return createdAt;
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="font-medium text-[#250E62]">Sorteios</h3>

      {loading ? (
        <p className="text-[#5b4d7a]">Carregando…</p>
      ) : draws.length === 0 ? (
        <p className="text-[#5b4d7a]">Nenhum sorteio realizado ainda.</p>
      ) : (
        <div className="rounded-lg border border-[#e2deeb] overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#faf9ff] border-b border-[#e2deeb]">
              <tr>
                <th className="px-4 py-3 font-medium text-[#3F228D]">Data</th>
                <th className="px-4 py-3 font-medium text-[#3F228D]">
                  Atribuições
                </th>
                <th className="px-4 py-3 font-medium text-[#3F228D]" />
              </tr>
            </thead>
            <tbody>
              {draws.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-[#e2deeb] hover:bg-[#faf9ff]"
                >
                  <td className="px-4 py-3">{formatDate(d.createdAt)}</td>
                  <td className="px-4 py-3">{d.resultCount}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/tenants/${tenantId}/draws/${d.id}`}
                      className="text-[#5936CC] hover:text-[#250E62] mr-3"
                    >
                      Ver
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleExcluir(d.id)}
                      disabled={deletingId === d.id}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      {deletingId === d.id ? "Excluindo…" : "Excluir"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
