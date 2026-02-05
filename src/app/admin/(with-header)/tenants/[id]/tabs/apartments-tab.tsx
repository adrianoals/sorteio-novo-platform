"use client";

import { useEffect, useMemo, useState } from "react";

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
  { value: "moto", label: "Moto" },
];

export function ApartmentsTab({
  tenantId,
  hasBlocks,
  hasBasement,
  basements,
}: {
  tenantId: string;
  hasBlocks: boolean;
  hasBasement: boolean;
  basements: string[];
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
  const [formAllowedSubsolos, setFormAllowedSubsolos] = useState<string[]>([]);
  const [formAddSubsolo, setFormAddSubsolo] = useState("");
  const [formAllowedBlocks, setFormAllowedBlocks] = useState<string[]>([]);
  const [formAddBlockId, setFormAddBlockId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deleteModalApartment, setDeleteModalApartment] = useState<Apartment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [filterBlockId, setFilterBlockId] = useState("");
  type ApartmentSortKey = "number" | "block" | "rights";
  const [sortBy, setSortBy] = useState<ApartmentSortKey>("number");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: ApartmentSortKey) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

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
    setFormAllowedSubsolos([]);
    setFormAllowedBlocks([]);
    setFormAddSubsolo(basements[0] ?? "");
    setFormAddBlockId(blocks[0]?.id ?? "");
    setShowForm(true);
    setError(null);
  };

  const openEdit = (a: Apartment) => {
    setEditingId(a.id);
    setFormNumber(a.number);
    setFormBlockId(a.blockId ?? "");
    const raw = Array.isArray(a.rights) && a.rights.length ? a.rights : ["simple"];
    const expanded = raw.flatMap((r) => (r === "two_simple" ? ["simple", "simple"] : [r]));
    setFormRights(expanded);
    setFormAllowedSubsolos([...(a.allowedSubsolos ?? [])]);
    setFormAllowedBlocks([...(a.allowedBlocks ?? [])]);
    setFormAddSubsolo(basements[0] ?? "");
    setFormAddBlockId(blocks[0]?.id ?? "");
    setShowForm(true);
    setError(null);
  };

  const addRight = () => {
    setFormRights((prev) => [...prev, formAddRight]);
  };
  const removeRight = (index: number) => {
    setFormRights((prev) => prev.filter((_, i) => i !== index));
  };
  const addSubsolo = () => {
    if (formAddSubsolo && !formAllowedSubsolos.includes(formAddSubsolo)) {
      setFormAllowedSubsolos((prev) => [...prev, formAddSubsolo]);
    }
  };
  const removeSubsolo = (index: number) => {
    setFormAllowedSubsolos((prev) => prev.filter((_, i) => i !== index));
  };
  const addBlock = () => {
    if (formAddBlockId && !formAllowedBlocks.includes(formAddBlockId)) {
      setFormAllowedBlocks((prev) => [...prev, formAddBlockId]);
    }
  };
  const removeBlock = (index: number) => {
    setFormAllowedBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setError(null);
  };

  const closeDeleteModal = () => {
    setDeleteModalApartment(null);
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
      const allowedSubsolos = hasBasement && formAllowedSubsolos.length ? formAllowedSubsolos : null;
      const allowedBlocks = hasBlocks && formAllowedBlocks.length ? formAllowedBlocks : null;
      const blockId = hasBlocks ? (formBlockId || null) : null;
      const body = editingId
        ? { number: formNumber, blockId, rights, allowedSubsolos, allowedBlocks }
        : { number: formNumber, blockId, rights, allowedSubsolos, allowedBlocks };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error ?? (data.details ? JSON.stringify(data.details) : null) ?? "Erro ao salvar.";
        setError(typeof msg === "string" ? msg : "Erro ao salvar.");
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
    if (!deleteModalApartment) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/tenants/${tenantId}/apartments/${deleteModalApartment.id}`,
        { method: "DELETE", credentials: "include" }
      );
      if (res.ok) {
        closeDeleteModal();
        closeForm();
        load();
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(deleteModalApartment.id);
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
          fetch(`/api/admin/tenants/${tenantId}/apartments/${id}`, {
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

  const rightsLabel = (a: Apartment) =>
    (Array.isArray(a.rights) ? a.rights : [a.rights])
      .map((r) => RIGHTS_OPTIONS.find((o) => o.value === r)?.label ?? (r === "two_simple" ? "2× Simples" : r))
      .join(", ");

  const displayedApartments = useMemo(() => {
    let list = apartments;
    if (filterBlockId) list = list.filter((a) => a.blockId === filterBlockId);
    const getBlockName = (a: Apartment) => blockName(a.blockId);
    const cmp = (v: number) => (v === 0 ? 0 : sortDir === "asc" ? v : -v);
    list = [...list].sort((a, b) => {
      let v = 0;
      if (sortBy === "number") v = String(a.number).localeCompare(String(b.number), "pt-BR", { numeric: true });
      else if (sortBy === "block") {
        v = getBlockName(a).localeCompare(getBlockName(b), "pt-BR");
        if (v === 0) v = String(a.number).localeCompare(String(b.number), "pt-BR", { numeric: true });
      } else {
        v = rightsLabel(a).localeCompare(rightsLabel(b), "pt-BR");
        if (v === 0) v = String(a.number).localeCompare(String(b.number), "pt-BR", { numeric: true });
      }
      return cmp(v);
    });
    return list;
  }, [apartments, filterBlockId, sortBy, sortDir, blocks]);

  const toggleSelectAll = () => {
    if (selectedIds.size === displayedApartments.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(displayedApartments.map((a) => a.id)));
  };

  const formContent = (
    <>
      <h4 className="font-medium text-[#250E62] mb-3">
        {editingId ? `Editar apartamento — ${formNumber || "…"}` : "Novo apartamento"}
      </h4>
      <div>
        <label className="block text-sm font-medium text-[#3F228D] mb-1">Número</label>
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
          <label className="block text-sm font-medium text-[#3F228D] mb-1">Bloco</label>
          <select
            value={formBlockId}
            onChange={(e) => setFormBlockId(e.target.value)}
            className="w-full max-w-xs rounded border border-[#e2deeb] px-3 py-2"
          >
            <option value="">—</option>
            {blocks.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-[#3F228D] mb-1">Direitos (pode ter mais de um)</label>
        <p className="text-xs text-[#5b4d7a] mb-1">Adicione &quot;Simples&quot; várias vezes para 2 ou mais vagas simples. Um apartamento = uma ficha.</p>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          {formRights.map((r, i) => (
            <span key={`${r}-${i}`} className="inline-flex items-center gap-1 rounded bg-[#e2deeb] px-2 py-0.5 text-sm">
              {RIGHTS_OPTIONS.find((o) => o.value === r)?.label ?? r}
              <button type="button" onClick={() => removeRight(i)} className="text-[#5b4d7a] hover:text-red-600" aria-label="Remover">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <select value={formAddRight} onChange={(e) => setFormAddRight(e.target.value)} className="rounded border border-[#e2deeb] px-3 py-2 text-sm">
            {RIGHTS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button type="button" onClick={addRight} className="rounded border border-[#e2deeb] px-3 py-2 text-sm text-[#3F228D] hover:bg-[#faf9ff]">Adicionar</button>
        </div>
      </div>
      {hasBasement && basements.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-[#3F228D] mb-1">Localizações permitidas (opcional)</label>
          <p className="text-xs text-[#5b4d7a] mb-1">Vazio = qualquer. Selecione para restringir.</p>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {formAllowedSubsolos.map((sub, i) => (
              <span key={`${sub}-${i}`} className="inline-flex items-center gap-1 rounded bg-[#e2deeb] px-2 py-0.5 text-sm">
                {sub}
                <button type="button" onClick={() => removeSubsolo(i)} className="text-[#5b4d7a] hover:text-red-600" aria-label="Remover">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <select value={formAddSubsolo} onChange={(e) => setFormAddSubsolo(e.target.value)} className="rounded border border-[#e2deeb] px-3 py-2 text-sm">
              {basements.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <button type="button" onClick={addSubsolo} className="rounded border border-[#e2deeb] px-3 py-2 text-sm text-[#3F228D] hover:bg-[#faf9ff]">Adicionar</button>
          </div>
        </div>
      )}
      {hasBlocks && blocks.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-[#3F228D] mb-1">Blocos permitidos (opcional)</label>
          <p className="text-xs text-[#5b4d7a] mb-1">Vazio = qualquer. Selecione para restringir.</p>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {formAllowedBlocks.map((blockId, i) => {
              const b = blocks.find((x) => x.id === blockId);
              return (
                <span key={`${blockId}-${i}`} className="inline-flex items-center gap-1 rounded bg-[#e2deeb] px-2 py-0.5 text-sm">
                  {b ? b.name : blockId.slice(0, 8)}
                  <button type="button" onClick={() => removeBlock(i)} className="text-[#5b4d7a] hover:text-red-600" aria-label="Remover">×</button>
                </span>
              );
            })}
          </div>
          <div className="flex gap-2">
            <select value={formAddBlockId} onChange={(e) => setFormAddBlockId(e.target.value)} className="rounded border border-[#e2deeb] px-3 py-2 text-sm">
              {blocks.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <button type="button" onClick={addBlock} className="rounded border border-[#e2deeb] px-3 py-2 text-sm text-[#3F228D] hover:bg-[#faf9ff]">Adicionar</button>
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="rounded bg-[#250E62] px-4 py-2 text-sm text-white hover:bg-[#1e0b4f] disabled:opacity-50">
          {saving ? "Salvando…" : editingId ? "Salvar" : "Criar"}
        </button>
        <button type="button" onClick={closeForm} className="rounded border border-[#e2deeb] px-4 py-2 text-sm text-[#3F228D] hover:bg-[#faf9ff]">
          Cancelar
        </button>
      </div>
    </>
  );

  if (loading) return <p className="text-[#5b4d7a]">Carregando…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium text-[#250E62]">Apartamentos</h3>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={openBulkDeleteModal}
              className="rounded border border-red-600 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Remover selecionados ({selectedIds.size})
            </button>
          )}
          <button type="button" onClick={openCreate} className="rounded bg-[#250E62] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#1e0b4f]">
            Novo apartamento
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
        {filterBlockId && (
          <span className="text-[#5b4d7a]">
            {displayedApartments.length} de {apartments.length} apartamento(s)
          </span>
        )}
      </div>

      {/* Formulário inline só para criar; edição vai para modal */}
      {showForm && !editingId && (
        <form onSubmit={submit} className="rounded-lg border border-[#e2deeb] bg-[#faf9ff] p-4 space-y-3">
          {formContent}
        </form>
      )}

      {/* Modal de edição */}
      {showForm && editingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => e.target === e.currentTarget && closeForm()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-apartment-title"
        >
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={submit}>
              {formContent}
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão em massa */}
      {bulkDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => e.target === e.currentTarget && closeBulkDeleteModal()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-delete-apartments-title"
        >
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h4 id="bulk-delete-apartments-title" className="font-medium text-[#250E62] mb-2">
              Remover apartamentos
            </h4>
            <p className="text-[#5b4d7a] mb-4">
              Remover <strong>{selectedIds.size}</strong> apartamento(s) selecionado(s)? Esta ação não pode ser desfeita.
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
                {bulkDeleting ? "Removendo…" : "Remover todos"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão (um único) */}
      {deleteModalApartment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => e.target === e.currentTarget && closeDeleteModal()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-apartment-title"
        >
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h4 id="delete-apartment-title" className="font-medium text-[#250E62] mb-2">
              Remover apartamento
            </h4>
            <p className="text-[#5b4d7a] mb-4">
              Remover o apartamento <strong>{deleteModalApartment.number}</strong>
              {hasBlocks && deleteModalApartment.blockId && (
                <> do bloco <strong>{blockName(deleteModalApartment.blockId)}</strong></>
              )}? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={closeDeleteModal}
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

      <div className="rounded-lg border border-[#e2deeb] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#faf9ff] border-b border-[#e2deeb]">
            <tr>
              <th className="w-10 px-2 py-3">
                <input
                  type="checkbox"
                  checked={displayedApartments.length > 0 && selectedIds.size === displayedApartments.length}
                  onChange={toggleSelectAll}
                  aria-label="Selecionar todos"
                  className="rounded border-[#e2deeb]"
                />
              </th>
              <th className="px-4 py-3">
                <button type="button" onClick={() => handleSort("number")} className="font-medium text-[#3F228D] hover:text-[#250E62] flex items-center gap-1">
                  Número {sortBy === "number" && (sortDir === "asc" ? "↑" : "↓")}
                </button>
              </th>
              <th className="px-4 py-3">
                <button type="button" onClick={() => handleSort("rights")} className="font-medium text-[#3F228D] hover:text-[#250E62] flex items-center gap-1">
                  Direitos {sortBy === "rights" && (sortDir === "asc" ? "↑" : "↓")}
                </button>
              </th>
              {hasBlocks && (
                <th className="px-4 py-3">
                  <button type="button" onClick={() => handleSort("block")} className="font-medium text-[#3F228D] hover:text-[#250E62] flex items-center gap-1">
                    Bloco {sortBy === "block" && (sortDir === "asc" ? "↑" : "↓")}
                  </button>
                </th>
              )}
              <th className="px-4 py-3 font-medium text-[#3F228D]" />
            </tr>
          </thead>
          <tbody>
            {displayedApartments.length === 0 ? (
              <tr>
                <td colSpan={hasBlocks ? 5 : 4} className="px-4 py-6 text-center text-[#5b4d7a]">
                  {apartments.length === 0 ? "Nenhum apartamento." : "Nenhum apartamento com o filtro selecionado."}
                </td>
              </tr>
            ) : (
              displayedApartments.map((a) => (
                <tr key={a.id} className="border-b border-[#e2deeb] hover:bg-[#faf9ff]">
                  <td className="w-10 px-2 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(a.id)}
                      onChange={() => toggleSelect(a.id)}
                      aria-label={`Selecionar apartamento ${a.number}`}
                      className="rounded border-[#e2deeb]"
                    />
                  </td>
                  <td className="px-4 py-3">{a.number}</td>
                  <td className="px-4 py-3">{rightsLabel(a)}</td>
                  {hasBlocks && <td className="px-4 py-3">{blockName(a.blockId)}</td>}
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => openEdit(a)} className="text-[#5936CC] hover:text-[#250E62] mr-3">
                      Editar
                    </button>
                    <button type="button" onClick={() => setDeleteModalApartment(a)} className="text-red-600 hover:text-red-800">
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
