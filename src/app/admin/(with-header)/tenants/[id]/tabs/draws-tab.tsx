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
  const [deleteModalDraw, setDeleteModalDraw] = useState<DrawItem | null>(null);

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

  function confirmExcluir() {
    if (!deleteModalDraw) return;
    const drawId = deleteModalDraw.id;
    setDeletingId(drawId);
    fetch(`/api/admin/tenants/${tenantId}/draws/${drawId}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then(async (r) => {
        if (r.ok) {
          setDeleteModalDraw(null);
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

      {deleteModalDraw && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => e.target === e.currentTarget && !deletingId && setDeleteModalDraw(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-draw-title"
        >
          <div
            className="bg-white rounded-xl shadow-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 id="delete-draw-title" className="font-medium text-[#250E62] mb-2">
              Excluir sorteio
            </h4>
            <p className="text-[#5b4d7a] mb-4">
              Excluir o sorteio de <strong>{formatDate(deleteModalDraw.createdAt)}</strong> ({deleteModalDraw.resultCount} atribuições)? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => !deletingId && setDeleteModalDraw(null)}
                disabled={!!deletingId}
                className="rounded border border-[#e2deeb] px-4 py-2 text-sm text-[#3F228D] hover:bg-[#faf9ff] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmExcluir}
                disabled={!!deletingId}
                className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deletingId ? "Excluindo…" : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                      onClick={() => setDeleteModalDraw(d)}
                      disabled={!!deletingId}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      Excluir
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
