"use client";

import { useEffect, useState } from "react";

type Block = { id: string; name: string; code: string | null };
type Spot = {
  id: string;
  number: string;
  basement: string | null;
  spotType: string;
  specialType: string | null;
  blockId: string | null;
};

export function SpotsTab({
  tenantId,
  hasBlocks,
  config,
}: {
  tenantId: string;
  hasBlocks: boolean;
  config?: { has_basement?: boolean; basements?: string[] } | null;
}) {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formNumber, setFormNumber] = useState("");
  const [formBasement, setFormBasement] = useState("");
  const [formBlockId, setFormBlockId] = useState("");
  const [formSpotType, setFormSpotType] = useState<"simple" | "double">("simple");
  const [formSpecialType, setFormSpecialType] = useState("normal");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const basements = config?.basements ?? [];
  const hasBasement = !!config?.has_basement;

  const load = () => {
    Promise.all([
      fetch(`/api/admin/tenants/${tenantId}/spots`).then((r) => r.json()),
      hasBlocks ? fetch(`/api/admin/tenants/${tenantId}/blocks`).then((r) => r.json()) : Promise.resolve([]),
    ])
      .then(([sps, blks]) => {
        setSpots(Array.isArray(sps) ? sps : []);
        setBlocks(Array.isArray(blks) ? blks : []);
      })
      .catch(() => {
        setSpots([]);
        setBlocks([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [tenantId, hasBlocks]);

  const openCreate = () => {
    setEditingId(null);
    setFormNumber("");
    setFormBasement(basements[0] ?? "");
    setFormBlockId("");
    setFormSpotType("simple");
    setFormSpecialType("normal");
    setShowForm(true);
    setError(null);
  };

  const openEdit = (s: Spot) => {
    setEditingId(s.id);
    setFormNumber(s.number);
    setFormBasement(s.basement ?? basements[0] ?? "");
    setFormBlockId(s.blockId ?? "");
    setFormSpotType(s.spotType as "simple" | "double");
    setFormSpecialType(s.specialType ?? "normal");
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
        ? `/api/admin/tenants/${tenantId}/spots/${editingId}`
        : `/api/admin/tenants/${tenantId}/spots`;
      const method = editingId ? "PATCH" : "POST";
      const body = {
        number: formNumber,
        blockId: formBlockId || null,
        basement: hasBasement ? (formBasement || null) : null,
        spotType: formSpotType,
        specialType: formSpecialType,
      };
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

  const remove = async (spotId: string) => {
    if (!confirm("Remover esta vaga?")) return;
    const res = await fetch(
      `/api/admin/tenants/${tenantId}/spots/${spotId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      closeForm();
      load();
    }
  };

  const blockName = (blockId: string | null) => {
    if (!blockId) return "—";
    const b = blocks.find((x) => x.id === blockId);
    return b ? b.name : blockId;
  };

  if (loading) return <p className="text-zinc-500">Carregando…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-zinc-800">Vagas</h3>
        <button
          type="button"
          onClick={openCreate}
          className="rounded bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Nova vaga
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={submit}
          className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-3"
        >
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Número
            </label>
            <input
              type="text"
              value={formNumber}
              onChange={(e) => setFormNumber(e.target.value)}
              required
              className="w-full max-w-xs rounded border border-zinc-300 px-3 py-2"
            />
          </div>
          {hasBasement && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Subsolo
              </label>
              {basements.length ? (
                <select
                  value={formBasement}
                  onChange={(e) => setFormBasement(e.target.value)}
                  className="w-full max-w-xs rounded border border-zinc-300 px-3 py-2"
                >
                  {basements.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formBasement}
                  onChange={(e) => setFormBasement(e.target.value)}
                  placeholder="Ex: Subsolo 1"
                  className="w-full max-w-xs rounded border border-zinc-300 px-3 py-2"
                />
              )}
            </div>
          )}
          {hasBlocks && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Bloco
              </label>
              <select
                value={formBlockId}
                onChange={(e) => setFormBlockId(e.target.value)}
                className="w-full max-w-xs rounded border border-zinc-300 px-3 py-2"
              >
                <option value="">—</option>
                {blocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Tipo
            </label>
            <select
              value={formSpotType}
              onChange={(e) => setFormSpotType(e.target.value as "simple" | "double")}
              className="w-full max-w-xs rounded border border-zinc-300 px-3 py-2"
            >
              <option value="simple">Simples</option>
              <option value="double">Dupla</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Especial
            </label>
            <select
              value={formSpecialType}
              onChange={(e) => setFormSpecialType(e.target.value)}
              className="w-full max-w-xs rounded border border-zinc-300 px-3 py-2"
            >
              <option value="normal">Normal</option>
              <option value="pne">PNE</option>
              <option value="idoso">Idoso</option>
              <option value="visitor">Visitante</option>
            </select>
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
              className="rounded bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50"
            >
              {saving ? "Salvando…" : editingId ? "Salvar" : "Criar"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="rounded-lg border border-zinc-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-4 py-3 font-medium text-zinc-700">Número</th>
              {hasBasement && (
                <th className="px-4 py-3 font-medium text-zinc-700">Subsolo</th>
              )}
              <th className="px-4 py-3 font-medium text-zinc-700">Tipo</th>
              <th className="px-4 py-3 font-medium text-zinc-700">Especial</th>
              {hasBlocks && (
                <th className="px-4 py-3 font-medium text-zinc-700">Bloco</th>
              )}
              <th className="px-4 py-3 font-medium text-zinc-700" />
            </tr>
          </thead>
          <tbody>
            {spots.length === 0 ? (
              <tr>
                <td colSpan={hasBasement && hasBlocks ? 6 : hasBasement || hasBlocks ? 5 : 4} className="px-4 py-6 text-center text-zinc-500">
                  Nenhuma vaga.
                </td>
              </tr>
            ) : (
              spots.map((s) => (
                <tr key={s.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="px-4 py-3">{s.number}</td>
                  {hasBasement && (
                    <td className="px-4 py-3">{s.basement ?? "—"}</td>
                  )}
                  <td className="px-4 py-3">{s.spotType}</td>
                  <td className="px-4 py-3">{s.specialType ?? "—"}</td>
                  {hasBlocks && (
                    <td className="px-4 py-3">{blockName(s.blockId)}</td>
                  )}
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openEdit(s)}
                      className="text-zinc-600 hover:text-zinc-800 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(s.id)}
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
