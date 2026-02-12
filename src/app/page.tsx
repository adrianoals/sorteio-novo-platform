import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f5f2ff]">
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="text-4xl font-bold text-[#250E62] sm:text-5xl">
          Sorteio Novo
        </h1>
        <p className="mt-4 max-w-2xl text-base text-[#5b4d7a] sm:text-lg">
          Plataforma para gestão de condomínios e sorteio de vagas de garagem.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/admin/login"
            className="rounded-lg bg-[#250E62] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1e0b4f]"
          >
            Acessar painel admin
          </Link>
          <Link
            href="/admin"
            className="rounded-lg border border-[#250E62] px-6 py-3 text-sm font-medium text-[#250E62] transition-colors hover:bg-[#ebe5ff]"
          >
            Ir para condomínios
          </Link>
        </div>
      </main>
    </div>
  );
}
