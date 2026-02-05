"use client";

import { useEffect, useMemo, useState } from "react";

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteModalSpot, setDeleteModalSpot] = useState<Spot | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [filterBlockId, setFilterBlockId] = useState("");
  const [filterBasement, setFilterBasement] = useState("");
  const [filterSpotType, setFilterSpotType] = useState<"" | "simple" | "double">("");
  const [filterSpecialType, setFilterSpecialType] = useState<"" | "normal" | "pne" | "idoso" | "visitor">("");
  type SpotSortKey = "number" | "block" | "basement" | "spotType" | "specialType";
  const [sortBy, setSortBy] = useState<SpotSortKey>("number");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: SpotSortKey) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

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

  const confirmRemove = async () => {
    if (!deleteModalSpot) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/tenants/${tenantId}/spots/${deleteModalSpot.id}`,
        { method: "DELETE", credentials: "include" }
      );
      if (res.ok) {
        setDeleteModalSpot(null);
        closeForm();
        load();
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(deleteModalSpot.id);
          return next;
        });
      }
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openBulkDeleteModal = () => setBulkDeleteModalOpen(true);
  const closeBulkDeleteModal = () => {
    if (!bulkDeleting) setBulkDeleteModalOpen(false);
  };

  const confirmBulkRemove = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkDeleting(true);
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/admin/tenants/${tenantId}/spots/${id}`, {
            method: "DELETE",
            credentials: "include",
          })
        )
      );
      setBulkDeleteModalOpen(false);
      setSelectedIds(new Set());
      load();
    } finally {
      setBulkDeleting(false);
    }
  };

  const blockName = (blockId: string | null) => {
    if (!blockId) return "—";
    const b = blocks.find((x) => x.id === blockId);
    return b ? b.name : blockId;
  };

  const displayedSpots = useMemo(() => {
    let list = spots;
    if (filterBlockId) list = list.filter((s) => s.blockId === filterBlockId);
    if (filterBasement) list = list.filter((s) => (s.basement ?? "") === filterBasement);
    if (filterSpotType) list = list.filter((s) => s.spotType === filterSpotType);
    if (filterSpecialType) list = list.filter((s) => (s.specialType ?? "normal") === filterSpecialType);
    const getBlockName = (s: Spot) => blockName(s.blockId);
    const getBasement = (s: Spot) => s.basement ?? "";
    const getSpotType = (s: Spot) => spotTypeLabel(s.spotType);
    const getSpecialType = (s: Spot) => specialTypeLabel(s.specialType);
    const cmp = (a: number) => (a === 0 ? 0 : sortDir === "asc" ? a : -a);
    list = [...list].sort((a, b) => {
      let v = 0;
      if (sortBy === "number") v = String(a.number).localeCompare(String(b.number), "pt-BR", { numeric: true });
      else if (sortBy === "block") {
        v = getBlockName(a).localeCompare(getBlockName(b), "pt-BR");
        if (v === 0) v = String(a.number).localeCompare(String(b.number), "pt-BR", { numeric: true });
      } else if (sortBy === "basement") {
        v = getBasement(a).localeCompare(getBasement(b), "pt-BR");
        if (v === 0) v = String(a.number).localeCompare(String(b.number), "pt-BR", { numeric: true });
      } else if (sortBy === "spotType") {
        v = getSpotType(a).localeCompare(getSpotType(b), "pt-BR");
        if (v === 0) v = String(a.number).localeCompare(String(b.number), "pt-BR", { numeric: true });
      } else {
        v = getSpecialType(a).localeCompare(getSpecialType(b), "pt-BR");
        if (v === 0) v = String(a.number).localeCompare(String(b.number), "pt-BR", { numeric: true });
      }
      return cmp(v);
    });
    return list;
  }, [spots, filterBlockId, filterBasement, filterSpotType, filterSpecialType, sortBy, sortDir, blocks]);

  const toggleSelectAll = () => {
    if (selectedIds.size === displayedSpots.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(displayedSpots.map((s) => s.id)));
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

  const spotLabel = (s: Spot) => [s.number, hasBasement && s.basement ? s.basement : null, hasBlocks && s.blockId ? blockName(s.blockId) : null].filter(Boolean).join(" · ");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium text-[#250E62]">Vagas</h3>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={openBulkDeleteModal}
              className="rounded border border-red-600 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Remover selecionadas ({selectedIds.size})
            </button>
          )}
          <button
            type="button"
            onClick={openCreate}
            className="rounded bg-[#250E62] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#1e0b4f]"
          >
            Nova vaga
          </button>
        </div>
      </div>

      {/* Filtros e ordenação */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {hasBlocks && blocks.length > 0 && (
          <label className="flex items-center gap-2">
            <span className="text-[#5b4d7a]">Bloco:</span>
            <select
              value={filterBlockId}
              onChange={(e) => setFilterBlockId(e.target.value)}
              className="rounded border border-[#e2deeb] px-2 py-1.5 text-[#3F228D] bg-white"
            >
              <option value="">Todos</option>
              {blocks.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>
        )}
        {hasBasement && basements.length > 0 && (
          <label className="flex items-center gap-2">
            <span className="text-[#5b4d7a]">Localização:</span>
            <select
              value={filterBasement}
              onChange={(e) => setFilterBasement(e.target.value)}
              className="rounded border border-[#e2deeb] px-2 py-1.5 text-[#3F228D] bg-white"
            >
              <option value="">Todas</option>
              {basements.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </label>
        )}
        <label className="flex items-center gap-2">
          <span className="text-[#5b4d7a]">Tipo:</span>
          <select
            value={filterSpotType}
            onChange={(e) => setFilterSpotType(e.target.value as "" | "simple" | "double")}
            className="rounded border border-[#e2deeb] px-2 py-1.5 text-[#3F228D] bg-white"
          >
            <option value="">Todos</option>
            <option value="simple">Simples</option>
            <option value="double">Dupla</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-[#5b4d7a]">Especial:</span>
          <select
            value={filterSpecialType}
            onChange={(e) => setFilterSpecialType(e.target.value as "" | "normal" | "pne" | "idoso" | "visitor")}
            className="rounded border border-[#e2deeb] px-2 py-1.5 text-[#3F228D] bg-white"
          >
            <option value="">Todos</option>
            <option value="normal">Normal</option>
            <option value="pne">PNE</option>
            <option value="idoso">Idoso</option>
            <option value="visitor">Visitante</option>
          </select>
        </label>
        {(filterBlockId || filterBasement || filterSpotType || filterSpecialType) && (
          <span className="text-[#5b4d7a]">
            {displayedSpots.length} de {spots.length} vaga(s)
          </span>
        )}
      </div>

      {/* Modal confirmação exclusão em massa */}
      {bulkDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => e.target === e.currentTarget && closeBulkDeleteModal()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-delete-spots-title"
        >
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h4 id="bulk-delete-spots-title" className="font-medium text-[#250E62] mb-2">
              Remover vagas
            </h4>
            <p className="text-[#5b4d7a] mb-4">
              Remover <strong>{selectedIds.size}</strong> vaga(s) selecionada(s)? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={closeBulkDeleteModal}
                disabled={bulkDeleting}
                className="rounded border border-[#e2deeb] px-4 py-2 text-sm text-[#3F228D] hover:bg-[#faf9ff] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmBulkRemove}
                disabled={bulkDeleting}
                className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                {bulkDeleting ? "Removendo…" : "Remover todas"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmação exclusão (uma vaga) */}
      {deleteModalSpot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => e.target === e.currentTarget && setDeleteModalSpot(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-spot-title"
        >
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h4 id="delete-spot-title" className="font-medium text-[#250E62] mb-2">
              Remover vaga
            </h4>
            <p className="text-[#5b4d7a] mb-4">
              Remover a vaga <strong>{deleteModalSpot.number}</strong>
              {hasBasement && deleteModalSpot.basement && <> ({deleteModalSpot.basement})</>}
              {hasBlocks && deleteModalSpot.blockId && <> — bloco {blockName(deleteModalSpot.blockId)}</>}? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDeleteModalSpot(null)}
                className="rounded border border-[#e2deeb] px-4 py-2 text-sm text-[#3F228D] hover:bg-[#faf9ff]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmRemove}
                disabled={deleting}
                className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Removendo…" : "Remover"}
              </button>
            </div>
          </div>
        </div>
      )}

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
              <th className="w-10 px-2 py-3">
                <input
                  type="checkbox"
                  checked={displayedSpots.length > 0 && selectedIds.size === displayedSpots.length}
                  onChange={toggleSelectAll}
                  aria-label="Selecionar todas"
                  className="rounded border-[#e2deeb]"
                />
              </th>
              <th className="px-4 py-3">
                <button type="button" onClick={() => handleSort("number")} className="font-medium text-[#3F228D] hover:text-[#250E62] flex items-center gap-1 w-full justify-start">
                  Número <span className="inline-block w-4 text-center opacity-70">{sortBy === "number" ? (sortDir === "asc" ? "↑" : "↓") : "↕"}</span>
                </button>
              </th>
              {hasBasement && (
                <th className="px-4 py-3">
                  <button type="button" onClick={() => handleSort("basement")} className="font-medium text-[#3F228D] hover:text-[#250E62] flex items-center gap-1 w-full justify-start">
                    Localização <span className="inline-block w-4 text-center opacity-70">{sortBy === "basement" ? (sortDir === "asc" ? "↑" : "↓") : "↕"}</span>
                  </button>
                </th>
              )}
              <th className="px-4 py-3">
                <button type="button" onClick={() => handleSort("spotType")} className="font-medium text-[#3F228D] hover:text-[#250E62] flex items-center gap-1 w-full justify-start">
                  Tipo <span className="inline-block w-4 text-center opacity-70">{sortBy === "spotType" ? (sortDir === "asc" ? "↑" : "↓") : "↕"}</span>
                </button>
              </th>
              <th className="px-4 py-3">
                <button type="button" onClick={() => handleSort("specialType")} className="font-medium text-[#3F228D] hover:text-[#250E62] flex items-center gap-1 w-full justify-start">
                  Especial <span className="inline-block w-4 text-center opacity-70">{sortBy === "specialType" ? (sortDir === "asc" ? "↑" : "↓") : "↕"}</span>
                </button>
              </th>
              {hasBlocks && (
                <th className="px-4 py-3">
                  <button type="button" onClick={() => handleSort("block")} className="font-medium text-[#3F228D] hover:text-[#250E62] flex items-center gap-1 w-full justify-start">
                    Bloco <span className="inline-block w-4 text-center opacity-70">{sortBy === "block" ? (sortDir === "asc" ? "↑" : "↓") : "↕"}</span>
                  </button>
                </th>
              )}
              <th className="px-4 py-3 font-medium text-[#3F228D]">Atribuído (travada)</th>
              <th className="px-4 py-3 font-medium text-[#3F228D]" />
            </tr>
          </thead>
          <tbody>
            {displayedSpots.length === 0 ? (
              <tr>
                <td colSpan={hasBasement && hasBlocks ? 8 : hasBasement || hasBlocks ? 7 : 6} className="px-4 py-6 text-center text-[#5b4d7a]">
                  {spots.length === 0 ? "Nenhuma vaga." : "Nenhuma vaga com o filtro selecionado."}
                </td>
              </tr>
            ) : (
              displayedSpots.map((s) => (
                <tr key={s.id} className="border-b border-[#e2deeb] hover:bg-[#faf9ff]">
                  <td className="w-10 px-2 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(s.id)}
                      onChange={() => toggleSelect(s.id)}
                      aria-label={`Selecionar vaga ${s.number}`}
                      className="rounded border-[#e2deeb]"
                    />
                  </td>
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
                      onClick={() => setDeleteModalSpot(s)}
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
