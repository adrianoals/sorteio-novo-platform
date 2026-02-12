"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError("Email ou senha inválidos.");
        setLoading(false);
        return;
      }
      window.location.href = callbackUrl;
    } catch {
      setError("Erro ao entrar. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-b from-[#5936CC] to-[#3F228D] p-4">
      <Image
        src="/images/LogoSorteioTrasparente.png"
        alt="Sorteio Novo"
        width={240}
        height={64}
        className="h-16 w-auto object-contain mb-6"
      />
      <div className="w-full max-w-sm rounded-xl bg-[#faf9ff] p-8 shadow-xl border border-[#e2deeb]">
        <p className="text-center text-[#3F228D] text-sm font-medium uppercase tracking-wider mb-2">
          Área administrativa
        </p>
        <h1 className="text-xl font-bold text-[#250E62] mb-6 text-center">
          Entrar
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#3F228D] mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@sorteionovo.local"
              className="w-full rounded border border-[#e2deeb] bg-white px-3 py-2 text-[#1a0d2e] placeholder:text-[#9b8fb5] focus:border-[#5936CC] focus:outline-none focus:ring-1 focus:ring-[#5936CC] hover:border-[#c4b8e0]"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[#3F228D] mb-1">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded border border-[#e2deeb] bg-white px-3 py-2 text-[#1a0d2e] placeholder:text-[#9b8fb5] focus:border-[#5936CC] focus:outline-none focus:ring-1 focus:ring-[#5936CC] hover:border-[#c4b8e0]"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-[#250E62] py-2.5 text-white font-medium hover:bg-[#1e0b4f] disabled:opacity-50 transition-colors"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
