import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Login page is under /admin/login; allow unauthenticated there
  // Middleware already redirects unauthenticated to login for other /admin routes
  if (!session?.user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/admin" className="font-medium text-zinc-800">
            SorteioNovo Admin
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">{session.user.email}</span>
            <Link
              href="/api/auth/signout"
              className="text-sm text-zinc-600 hover:text-zinc-800"
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
