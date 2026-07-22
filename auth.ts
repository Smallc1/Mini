import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { prisma } from "./lib/prisma";
import { loginSchema } from "./lib/validations";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "邮箱或手机号", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { identifier, password } = parsed.data;
        const user = identifier.includes("@")
          ? await prisma.user.findUnique({ where: { email: identifier.toLowerCase() } })
          : await (async () => { const { findUserIdByPhone } = await import("./lib/accounts"); const id = await findUserIdByPhone(identifier); return id ? prisma.user.findUnique({ where: { id } }) : null; })();
        if (!user || user.isDisabled) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        // A successful login invalidates every older JWT for this account.
        const activeUser = await prisma.user.update({
          where: { id: user.id },
          data: { sessionVersion: { increment: 1 } },
          select: { id: true, email: true, name: true, role: true, sessionVersion: true },
        });

        return activeUser;
      },
    }),
  ],
});
