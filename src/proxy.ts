import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function proxy(request: NextRequest) {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const { nextUrl } = request;

  // Public: login page and auth API
  if (nextUrl.pathname.startsWith("/admin/login") || nextUrl.pathname.startsWith("/api/auth")) {
    if (isLoggedIn && nextUrl.pathname.startsWith("/admin/login")) {
      return NextResponse.redirect(new URL("/admin", nextUrl.origin));
    }
    return NextResponse.next();
  }

  // Protect /admin/*
  if (nextUrl.pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      const login = new URL("/admin/login", nextUrl.origin);
      login.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
      return NextResponse.redirect(login);
    }
  }

  // Protect /api/admin/*
  if (nextUrl.pathname.startsWith("/api/admin")) {
    if (!isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/auth/:path*", "/api/admin/:path*"],
};
