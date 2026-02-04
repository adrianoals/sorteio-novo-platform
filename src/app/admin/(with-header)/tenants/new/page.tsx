"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewTenantPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSlugFromName = () => {
    const s = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    setSlug(s);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: slug || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erro ao criar tenant.");
        setLoading(false);
        return;
      }
      router.push(`/admin/tenants/${data.id}`);
    } catch {
      setError("Erro de conexão.");
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin"
          className="text-sm font-medium text-[#5936CC] hover:text-[#250E62]"
        >
          ← Voltar
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[#250E62] mb-6">
        Novo condomínio
      </h1>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-[#3F228D] mb-1">
            Nome
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSlugFromName}
            required
            className="w-full rounded border border-[#e2deeb] bg-white px-3 py-2 text-[#1a0d2e] focus:border-[#5936CC] focus:outline-none focus:ring-1 focus:ring-[#5936CC]"
          />
        </div>
        <div>
          <label htmlFor="slug" className="block text-xs font-semibold uppercase tracking-wider text-[#3F228D] mb-1">
            Slug
          </label>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="ex: condominio-teste"
            required
            className="w-full rounded border border-[#e2deeb] bg-white px-3 py-2 text-[#1a0d2e] placeholder:text-[#9b8fb5] focus:border-[#5936CC] focus:outline-none focus:ring-1 focus:ring-[#5936CC]"
          />
          <p className="mt-1 text-xs text-[#5b4d7a]">
            Minúsculas, números e hífens. Único no sistema.
          </p>
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-[#250E62] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e0b4f] disabled:opacity-50 transition-colors"
          >
            {loading ? "Criando…" : "Criar"}
          </button>
          <Link
            href="/admin"
            className="rounded border border-[#e2deeb] px-4 py-2 text-sm font-medium text-[#3F228D] hover:bg-[#faf9ff] transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
