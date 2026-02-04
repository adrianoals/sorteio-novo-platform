import { auth } from "@/auth";
import Link from "next/link";
import Image from "next/image";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#faf9ff]">
      <header className="border-b border-[#e2deeb] bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/admin" className="flex items-center gap-3">
            <Image
              src="/images/LogoSorteioNovoComFundoBranco.png"
              alt="Sorteio Novo"
              width={140}
              height={44}
              className="h-10 w-auto object-contain"
            />
            <span className="text-xl font-bold tracking-tight text-[#250E62] hidden sm:inline">
              Admin
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#5b4d7a]">{session.user.email}</span>
            <Link
              href="/api/auth/signout"
              className="text-sm font-medium text-[#3F228D] hover:text-[#5936CC]"
            >
              Sair
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
