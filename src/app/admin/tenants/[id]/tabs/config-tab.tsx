"use client";

import { useState } from "react";

type Tenant = {
  id: string;
  name: string;
  slug: string;
  status: string;
  config?: {
    has_blocks?: boolean;
    has_basement?: boolean;
    basements?: string[];
    enabled_features?: { pne?: boolean; idoso?: boolean };
    intended_draw_type?: "S1" | "S2" | "S3";
  } | null;
};

export function TenantConfigTab({ tenant }: { tenant: Tenant }) {
  const [hasBlocks, setHasBlocks] = useState(!!tenant.config?.has_blocks);
  const [hasBasement, setHasBasement] = useState(!!tenant.config?.has_basement);
  const [basements, setBasements] = useState<string[]>(
    tenant.config?.basements?.length ? [...tenant.config.basements] : [""]
  );
  const [pne, setPne] = useState(!!tenant.config?.enabled_features?.pne);
  const [idoso, setIdoso] = useState(!!tenant.config?.enabled_features?.idoso);
  const [intendedDrawType, setIntendedDrawType] = useState<string>(
    tenant.config?.intended_draw_type ?? "S1"
  );
  const [status, setStatus] = useState(tenant.status);
  const [name, setName] = useState(tenant.name);
  const [slug, setSlug] = useState(tenant.slug);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const addBasement = () => setBasements((b) => [...b, ""]);
  const removeBasement = (i: number) =>
    setBasements((b) => b.filter((_, idx) => idx !== i));
  const setBasementAt = (i: number, v: string) =>
    setBasements((b) => {
      const next = [...b];
      next[i] = v;
      return next;
    });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          status,
          config: {
            has_blocks: hasBlocks,
            has_basement: hasBasement,
            basements: basements.filter((s) => s.trim()),
            enabled_features: { pne, idoso },
            intended_draw_type: intendedDrawType as "S1" | "S2" | "S3",
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Erro ao salvar." });
        setSaving(false);
        return;
      }
      setMessage({ type: "ok", text: "Salvo." });
    } catch {
      setMessage({ type: "error", text: "Erro de conexão." });
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[#3F228D] mb-1">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-[#e2deeb] px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#3F228D] mb-1">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded border border-[#e2deeb] px-3 py-2"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-[#3F228D] mb-1">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded border border-[#e2deeb] px-3 py-2"
        >
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
        </select>
      </div>
      <div className="space-y-4 border-t border-[#e2deeb] pt-6">
        <h3 className="font-medium text-[#250E62]">Configuração</h3>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hasBlocks}
            onChange={(e) => setHasBlocks(e.target.checked)}
          />
          <span className="text-sm">Usa blocos</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hasBasement}
            onChange={(e) => setHasBasement(e.target.checked)}
          />
          <span className="text-sm">Usa subsolo</span>
        </label>
        {hasBasement && (
          <div>
            <label className="block text-sm font-medium text-[#3F228D] mb-1">
              Subsolos
            </label>
            <div className="space-y-2">
              {basements.map((b, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={b}
                    onChange={(e) => setBasementAt(i, e.target.value)}
                    placeholder="Ex: Subsolo 1"
                    className="flex-1 rounded border border-[#e2deeb] px-3 py-2"
                  />
                  <button
                    type="button"
                    onClick={() => removeBasement(i)}
                    className="text-[#5b4d7a] hover:text-[#3F228D]"
                  >
                    Remover
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addBasement}
                className="text-sm text-[#5936CC] hover:text-[#250E62]"
              >
                + Adicionar subsolo
              </button>
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-[#3F228D] mb-2">
            Recursos habilitados
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={pne}
              onChange={(e) => setPne(e.target.checked)}
            />
            <span className="text-sm">PNE</span>
          </label>
          <label className="flex items-center gap-2 mt-1">
            <input
              type="checkbox"
              checked={idoso}
              onChange={(e) => setIdoso(e.target.checked)}
            />
            <span className="text-sm">Idoso</span>
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#3F228D] mb-1">
            Tipo de sorteio pretendido
          </label>
          <select
            value={intendedDrawType}
            onChange={(e) => setIntendedDrawType(e.target.value)}
            className="rounded border border-[#e2deeb] px-3 py-2"
          >
            <option value="S1">S1</option>
            <option value="S2">S2</option>
            <option value="S3">S3</option>
          </select>
        </div>
      </div>
      {message && (
        <p
          className={
            message.type === "ok" ? "text-sm text-emerald-600" : "text-sm text-red-600"
          }
          role="alert"
        >
          {message.text}
        </p>
      )}
      <button
        type="submit"
        disabled={saving}
        className="rounded bg-[#250E62] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e0b4f] disabled:opacity-50"
      >
        {saving ? "Salvando…" : "Salvar"}
      </button>
    </form>
  );
}
