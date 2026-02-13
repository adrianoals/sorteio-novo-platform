import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string | null;
      name: string | null;
      image: string | null;
      role: string;
    };
  }
}

const nextAuth = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || typeof credentials.password !== "string") {
          return null;
        }
        const email = String(credentials.email).trim().toLowerCase();

        const findUserWithRetry = async () => {
          let attempts = 0;
          while (attempts < 3) {
            try {
              const [user] = await db
                .select()
                .from(users)
                .where(eq(users.email, email))
                .limit(1);
              return user;
            } catch (error) {
              attempts += 1;
              if (attempts >= 3) {
                console.error("Auth authorize DB error:", error);
                return null;
              }
              await new Promise((resolve) => setTimeout(resolve, attempts * 150));
            }
          }
          return null;
        };

        const user = await findUserWithRetry();
        if (!user) {
          return null;
        }
        const ok = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!ok) {
          return null;
        }
        return {
          id: user.id,
          email: user.email,
          name: user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "user";
      }
      return session;
    },
  },
});

export const { handlers, auth, signIn, signOut } = nextAuth;
export const { GET, POST } = handlers;
