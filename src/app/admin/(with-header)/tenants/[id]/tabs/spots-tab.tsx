"use client";

import { useEffect, useState } from "react";

type Block = { id: string; name: string; code: string | null };
type Apartment = { id: string; number: string; blockId: string | null };
type Spot = {
  id: string;
  number: string;
  basement: string | null;
  spotType: string;
  specialType: string | null;
  blockId: string | null;
  apartmentId: string | null;
};

const SPOT_TYPE_LABELS: Record<string, string> = {
  simple: "Simples",
  double: "Dupla",
};
const SPECIAL_TYPE_LABELS: Record<string, string> = {
  normal: "Normal",
  pne: "PNE",
  idoso: "Idoso",
  visitor: "Visitante",
};

function spotTypeLabel(value: string): string {
  return SPOT_TYPE_LABELS[value] ?? value;
}
function specialTypeLabel(value: string | null): string {
  if (!value) return "—";
  return SPECIAL_TYPE_LABELS[value] ?? value;
}

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
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
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
      fetch(`/api/admin/tenants/${tenantId}/apartments`).then((r) => r.json()),
    ])
      .then(([sps, blks, apts]) => {
        setSpots(Array.isArray(sps) ? sps : []);
        setBlocks(Array.isArray(blks) ? blks : []);
        setApartments(Array.isArray(apts) ? apts : []);
      })
      .catch(() => {
        setSpots([]);
        setBlocks([]);
        setApartments([]);
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

  const apartmentName = (apartmentId: string | null) => {
    if (!apartmentId) return "—";
    const a = apartments.find((x) => x.id === apartmentId);
    return a ? `Apt ${a.number}` : apartmentId.slice(0, 8);
  };

  const assignSpot = async (spotId: string, apartmentId: string | null) => {
    setAssigningId(spotId);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/spots/${spotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apartmentId }),
      });
      if (res.ok) load();
      else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Erro ao atribuir.");
      }
    } catch {
      alert("Erro de conexão.");
    }
    setAssigningId(null);
  };

  if (loading) return <p className="text-[#5b4d7a]">Carregando…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-[#250E62]">Vagas</h3>
        <button
          type="button"
          onClick={openCreate}
          className="rounded bg-[#250E62] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#1e0b4f]"
        >
          Nova vaga
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
          {hasBasement && (
            <div>
              <label className="block text-sm font-medium text-[#3F228D] mb-1">
                Localização
              </label>
              {basements.length ? (
                <select
                  value={formBasement}
                  onChange={(e) => setFormBasement(e.target.value)}
                  className="w-full max-w-xs rounded border border-[#e2deeb] px-3 py-2"
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
                  placeholder="Ex: Térreo, Subsolo 1"
                  className="w-full max-w-xs rounded border border-[#e2deeb] px-3 py-2"
                />
              )}
            </div>
          )}
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
              Tipo
            </label>
            <select
              value={formSpotType}
              onChange={(e) => setFormSpotType(e.target.value as "simple" | "double")}
              className="w-full max-w-xs rounded border border-[#e2deeb] px-3 py-2"
            >
              <option value="simple">Simples</option>
              <option value="double">Dupla</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#3F228D] mb-1">
              Especial
            </label>
            <select
              value={formSpecialType}
              onChange={(e) => setFormSpecialType(e.target.value)}
              className="w-full max-w-xs rounded border border-[#e2deeb] px-3 py-2"
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
              {hasBasement && (
                <th className="px-4 py-3 font-medium text-[#3F228D]">Localização</th>
              )}
              <th className="px-4 py-3 font-medium text-[#3F228D]">Tipo</th>
              <th className="px-4 py-3 font-medium text-[#3F228D]">Especial</th>
              {hasBlocks && (
                <th className="px-4 py-3 font-medium text-[#3F228D]">Bloco</th>
              )}
              <th className="px-4 py-3 font-medium text-[#3F228D]">Atribuído (travada)</th>
              <th className="px-4 py-3 font-medium text-[#3F228D]" />
            </tr>
          </thead>
          <tbody>
            {spots.length === 0 ? (
              <tr>
                <td colSpan={hasBasement && hasBlocks ? 7 : hasBasement || hasBlocks ? 6 : 5} className="px-4 py-6 text-center text-[#5b4d7a]">
                  Nenhuma vaga.
                </td>
              </tr>
            ) : (
              spots.map((s) => (
                <tr key={s.id} className="border-b border-[#e2deeb] hover:bg-[#faf9ff]">
                  <td className="px-4 py-3">{s.number}</td>
                  {hasBasement && (
                    <td className="px-4 py-3">{s.basement ?? "—"}</td>
                  )}
                  <td className="px-4 py-3">{spotTypeLabel(s.spotType)}</td>
                  <td className="px-4 py-3">{specialTypeLabel(s.specialType)}</td>
                  {hasBlocks && (
                    <td className="px-4 py-3">{blockName(s.blockId)}</td>
                  )}
                  <td className="px-4 py-3">
                    {s.apartmentId ? (
                      <span className="text-emerald-600 font-medium">{apartmentName(s.apartmentId)}</span>
                    ) : (
                      "—"
                    )}
                    {assigningId === s.id ? (
                      <span className="ml-2 text-[#5b4d7a]">…</span>
                    ) : (
                      <div className="mt-1 flex flex-wrap gap-1">
                        <select
                          className="rounded border border-[#e2deeb] px-2 py-0.5 text-xs"
                          value=""
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v) assignSpot(s.id, v);
                            e.target.value = "";
                          }}
                        >
                          <option value="">Atribuir a…</option>
                          {apartments.map((a) => (
                            <option key={a.id} value={a.id}>
                              Apt {a.number}
                            </option>
                          ))}
                        </select>
                        {s.apartmentId && (
                          <button
                            type="button"
                            onClick={() => assignSpot(s.id, null)}
                            className="text-xs text-[#5b4d7a] hover:text-red-600"
                          >
                            Desatribuir
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openEdit(s)}
                      className="text-[#5936CC] hover:text-[#250E62] mr-3"
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
