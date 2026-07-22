import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config (no Prisma / bcrypt imports).
 * Used by middleware and extended in auth.ts with the Credentials provider.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [], // real providers are added in auth.ts
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "USER";
        token.sessionVersion = (user as { sessionVersion?: number }).sessionVersion ?? 0;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "USER";
        session.user.sessionVersion = (token.sessionVersion as number) ?? 0;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
