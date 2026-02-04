"use client";

import { useEffect, useState } from "react";

type Block = { id: string; name: string; code: string | null };
type Apartment = {
  id: string;
  number: string;
  rights: string[];
  blockId: string | null;
  allowedSubsolos?: string[] | null;
  allowedBlocks?: string[] | null;
};

const RIGHTS_OPTIONS = [
  { value: "simple", label: "Simples" },
  { value: "double", label: "Dupla" },
  { value: "two_simple", label: "Duas simples" },
  { value: "car", label: "Carro" },
  { value: "moto", label: "Moto" },
];

export function ApartmentsTab({
  tenantId,
  hasBlocks,
}: {
  tenantId: string;
  hasBlocks: boolean;
}) {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formNumber, setFormNumber] = useState("");
  const [formBlockId, setFormBlockId] = useState("");
  const [formRights, setFormRights] = useState<string[]>([]);
  const [formAddRight, setFormAddRight] = useState("simple");
  const [formAllowedSubsolos, setFormAllowedSubsolos] = useState("");
  const [formAllowedBlocks, setFormAllowedBlocks] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    Promise.all([
      fetch(`/api/admin/tenants/${tenantId}/apartments`).then((r) => r.json()),
      hasBlocks ? fetch(`/api/admin/tenants/${tenantId}/blocks`).then((r) => r.json()) : Promise.resolve([]),
    ])
      .then(([apts, blks]) => {
        setApartments(Array.isArray(apts) ? apts : []);
        setBlocks(Array.isArray(blks) ? blks : []);
      })
      .catch(() => {
        setApartments([]);
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
    setFormBlockId("");
    setFormRights(["simple"]);
    setFormAllowedSubsolos("");
    setFormAllowedBlocks([]);
    setShowForm(true);
    setError(null);
  };

  const openEdit = (a: Apartment) => {
    setEditingId(a.id);
    setFormNumber(a.number);
    setFormBlockId(a.blockId ?? "");
    setFormRights(Array.isArray(a.rights) && a.rights.length ? [...a.rights] : ["simple"]);
    setFormAllowedSubsolos((a.allowedSubsolos ?? []).join(", "));
    setFormAllowedBlocks(a.allowedBlocks ?? []);
    setShowForm(true);
    setError(null);
  };

  const addRight = () => {
    setFormRights((prev) => [...prev, formAddRight]);
  };
  const removeRight = (index: number) => {
    setFormRights((prev) => prev.filter((_, i) => i !== index));
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
        ? `/api/admin/tenants/${tenantId}/apartments/${editingId}`
        : `/api/admin/tenants/${tenantId}/apartments`;
      const method = editingId ? "PATCH" : "POST";
      const rights = formRights.length ? formRights : ["simple"];
      const allowedSubsolos = formAllowedSubsolos.trim()
        ? formAllowedSubsolos.split(",").map((s) => s.trim()).filter(Boolean)
        : null;
      const allowedBlocks = formAllowedBlocks.length ? formAllowedBlocks : null;
      const body = editingId
        ? { number: formNumber, blockId: formBlockId || null, rights, allowedSubsolos, allowedBlocks }
        : { number: formNumber, blockId: formBlockId || null, rights, allowedSubsolos, allowedBlocks };
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

  const remove = async (apartmentId: string) => {
    if (!confirm("Remover este apartamento?")) return;
    const res = await fetch(
      `/api/admin/tenants/${tenantId}/apartments/${apartmentId}`,
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

  if (loading) return <p className="text-[#5b4d7a]">Carregando…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-[#250E62]">Apartamentos</h3>
        <button
          type="button"
          onClick={openCreate}
          className="rounded bg-[#250E62] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#1e0b4f]"
        >
          Novo apartamento
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={submit}
          className="rounded-lg border border-[#e2deeb] bg-[#faf9ff] p-4 space-y-3"
        >
          <div>
            <label className="block text-sm font-medium text-[#3F228D] mb-1">
              Número
            </label>
            <input
              type="text"
              value={formNumber}
              onChange={(e) => setFormNumber(e.target.value)}
              required
              className="w-full max-w-xs rounded border border-[#e2deeb] px-3 py-2"
            />
          </div>
          {hasBlocks && (
            <div>
              <label className="block text-sm font-medium text-[#3F228D] mb-1">
                Bloco
              </label>
              <select
                value={formBlockId}
                onChange={(e) => setFormBlockId(e.target.value)}
                className="w-full max-w-xs rounded border border-[#e2deeb] px-3 py-2"
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
            <label className="block text-sm font-medium text-[#3F228D] mb-1">
              Direitos (pode ter mais de um)
            </label>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {formRights.map((r, i) => (
                <span
                  key={`${r}-${i}`}
                  className="inline-flex items-center gap-1 rounded bg-[#e2deeb] px-2 py-0.5 text-sm"
                >
                  {RIGHTS_OPTIONS.find((o) => o.value === r)?.label ?? r}
                  <button type="button" onClick={() => removeRight(i)} className="text-[#5b4d7a] hover:text-red-600" aria-label="Remover">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <select
                value={formAddRight}
                onChange={(e) => setFormAddRight(e.target.value)}
                className="rounded border border-[#e2deeb] px-3 py-2 text-sm"
              >
                {RIGHTS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button type="button" onClick={addRight} className="rounded border border-[#e2deeb] px-3 py-2 text-sm text-[#3F228D] hover:bg-[#faf9ff]">
                Adicionar
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#3F228D] mb-1">
              Subsolos permitidos (opcional)
            </label>
            <input
              type="text"
              value={formAllowedSubsolos}
              onChange={(e) => setFormAllowedSubsolos(e.target.value)}
              placeholder="Ex: Subsolo 1, Subsolo 2 — vazio = qualquer"
              className="w-full max-w-md rounded border border-[#e2deeb] px-3 py-2 text-sm"
            />
          </div>
          {hasBlocks && (
            <div>
              <label className="block text-sm font-medium text-[#3F228D] mb-1">
                Blocos permitidos (opcional)
              </label>
              <select
                multiple
                value={formAllowedBlocks}
                onChange={(e) => setFormAllowedBlocks(Array.from(e.target.selectedOptions, (o) => o.value))}
                className="w-full max-w-xs rounded border border-[#e2deeb] px-3 py-2 text-sm"
              >
                {blocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[#5b4d7a] mt-0.5">Segure Ctrl/Cmd para múltiplos. Vazio = qualquer bloco.</p>
            </div>
          )}
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
              <th className="px-4 py-3 font-medium text-[#3F228D]">Número</th>
              <th className="px-4 py-3 font-medium text-[#3F228D]">Direitos</th>
              {hasBlocks && (
                <th className="px-4 py-3 font-medium text-[#3F228D]">Bloco</th>
              )}
              <th className="px-4 py-3 font-medium text-[#3F228D]" />
            </tr>
          </thead>
          <tbody>
            {apartments.length === 0 ? (
              <tr>
                <td colSpan={hasBlocks ? 4 : 3} className="px-4 py-6 text-center text-[#5b4d7a]">
                  Nenhum apartamento.
                </td>
              </tr>
            ) : (
              apartments.map((a) => (
                <tr key={a.id} className="border-b border-[#e2deeb] hover:bg-[#faf9ff]">
                  <td className="px-4 py-3">{a.number}</td>
                  <td className="px-4 py-3">{(Array.isArray(a.rights) ? a.rights : [a.rights]).map((r) => RIGHTS_OPTIONS.find((o) => o.value === r)?.label ?? r).join(", ")}</td>
                  {hasBlocks && (
                    <td className="px-4 py-3">{blockName(a.blockId)}</td>
                  )}
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openEdit(a)}
                      className="text-[#5936CC] hover:text-[#250E62] mr-3"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(a.id)}
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
