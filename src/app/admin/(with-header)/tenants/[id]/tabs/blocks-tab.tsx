"use client";

import { useEffect, useState } from "react";

type Block = { id: string; name: string; code: string | null };

export function BlocksTab({ tenantId }: { tenantId: string }) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    fetch(`/api/admin/tenants/${tenantId}/blocks`)
      .then((r) => r.json())
      .then((data) => setBlocks(Array.isArray(data) ? data : []))
      .catch(() => setBlocks([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [tenantId]);

  const openCreate = () => {
    setEditingId(null);
    setFormName("");
    setFormCode("");
    setShowForm(true);
    setError(null);
  };

  const openEdit = (b: Block) => {
    setEditingId(b.id);
    setFormName(b.name);
    setFormCode(b.code ?? "");
    setShowForm(true);
    setError(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/tenants/${tenantId}/blocks/${editingId}`
        : `/api/admin/tenants/${tenantId}/blocks`;
      const method = editingId ? "PATCH" : "POST";
      const body = editingId
        ? { name: formName, code: formCode || null }
        : { name: formName, code: formCode || null };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erro ao salvar.");
        setSaving(false);
        return;
      }
      closeForm();
      load();
    } catch {
      setError("Erro de conexão.");
    }
    setSaving(false);
  };

  const remove = async (blockId: string) => {
    if (!confirm("Remover este bloco?")) return;
    const res = await fetch(
      `/api/admin/tenants/${tenantId}/blocks/${blockId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      closeForm();
      load();
    }
  };

  if (loading) return <p className="text-[#5b4d7a]">Carregando…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-[#250E62]">Blocos</h3>
        <button
          type="button"
          onClick={openCreate}
          className="rounded bg-[#250E62] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#1e0b4f]"
        >
          Novo bloco
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={submit}
          className="rounded-lg border border-[#e2deeb] bg-[#faf9ff] p-4 space-y-3"
        >
          <div>
            <label className="block text-sm font-medium text-[#3F228D] mb-1">
              Nome
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              className="w-full max-w-xs rounded border border-[#e2deeb] px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#3F228D] mb-1">
              Código
            </label>
            <input
              type="text"
              value={formCode}
              onChange={(e) => setFormCode(e.target.value)}
              className="w-full max-w-xs rounded border border-[#e2deeb] px-3 py-2"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-[#250E62] px-4 py-2 text-sm text-white hover:bg-[#1e0b4f] disabled:opacity-50"
            >
              {saving ? "Salvando…" : editingId ? "Salvar" : "Criar"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded border border-[#e2deeb] px-4 py-2 text-sm text-[#3F228D] hover:bg-[#faf9ff]"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="rounded-lg border border-[#e2deeb] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#faf9ff] border-b border-[#e2deeb]">
            <tr>
              <th className="px-4 py-3 font-medium text-[#3F228D]">Nome</th>
              <th className="px-4 py-3 font-medium text-[#3F228D]">Código</th>
              <th className="px-4 py-3 font-medium text-[#3F228D]" />
            </tr>
          </thead>
          <tbody>
            {blocks.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-[#5b4d7a]">
                  Nenhum bloco.
                </td>
              </tr>
            ) : (
              blocks.map((b) => (
                <tr key={b.id} className="border-b border-[#e2deeb] hover:bg-[#faf9ff]">
                  <td className="px-4 py-3">{b.name}</td>
                  <td className="px-4 py-3">{b.code ?? "—"}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openEdit(b)}
                      className="text-[#5936CC] hover:text-[#250E62] mr-3"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(b.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remover
                    </button>
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
