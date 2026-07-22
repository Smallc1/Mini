"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/auth";
import { registerSchema } from "@/lib/validations";
import { findUserIdByPhone, setUserPhone } from "@/lib/accounts";
import { notifyAdmins } from "@/lib/notifications";

export type AuthState = { error?: string } | undefined;

export async function registerAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "输入有误" };
  }

  const { name, email, phone, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "该邮箱已被注册" };
  }
  if (await findUserIdByPhone(phone)) return { error: "该手机号码已被使用" };

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: "USER" },
  });
  await setUserPhone(user.id, phone);
  await notifyAdmins("USER_REGISTER", "新用户注册", `${name}（${email}）已注册账号`, "/admin/users");

  // Auto sign-in after registration.
  await signIn("credentials", {
    identifier: email,
    password,
    redirectTo: "/",
  });

  return undefined;
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const identifier = String(formData.get("identifier") ?? "");
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/") || "/";

  try {
    await signIn("credentials", {
      identifier,
      password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "邮箱、手机号或密码错误" };
    }
    throw error; // redirect() throws internally; let it propagate
  }

  return undefined;
}

export async function logoutAction() {
  await signOut({ redirect: false });
  redirect("/");
}
