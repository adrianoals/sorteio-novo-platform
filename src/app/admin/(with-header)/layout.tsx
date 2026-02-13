import Link from "next/link";
import Image from "next/image";
import { auth, signOut } from "@/auth";

export default async function AdminWithHeaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/admin/login" });
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
          <div className="flex gap-4 items-center">
            <span className="text-sm text-[#5b4d7a]">{session?.user?.email ?? ""}</span>
            <form action={handleSignOut}>
              <button
                type="submit"
                className="cursor-pointer rounded-lg border border-[#e2deeb] px-3 py-1.5 text-sm font-medium text-[#3F228D] transition-colors hover:bg-[#faf9ff] hover:text-[#5936CC] hover:border-[#5936CC]"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
