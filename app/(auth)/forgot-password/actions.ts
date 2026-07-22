"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { consumeResetCode, createResetCode, incrementResetAttempts, latestResetCode } from "@/lib/accounts";
import { sendPasswordResetCode } from "@/lib/email";

export type ResetState = { error?: string; success?: string } | undefined;

export async function requestResetCode(_previous: ResetState, formData: FormData): Promise<ResetState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "请输入有效的邮箱" };
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return { success: "如果该邮箱已注册，验证码将发送到邮箱" };
  const latest = await latestResetCode(user.id);
  if (latest && Date.now() - latest.createdAt.getTime() < 60_000) return { error: "发送过于频繁，请一分钟后重试" };
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await createResetCode(user.id, await bcrypt.hash(code, 10), new Date(Date.now() + 10 * 60_000));
  try { await sendPasswordResetCode(email, code); } catch { return { error: "验证码发送失败，请稍后重试" }; }
  return { success: "验证码已发送，有效期 10 分钟" };
}

export async function resetPassword(_previous: ResetState, formData: FormData): Promise<ResetState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const code = String(formData.get("code") || "").trim();
  const password = String(formData.get("password") || "");
  if (password.length < 6 || password.length > 100) return { error: "密码至少需要 6 个字符" };
  if (!/^\d{6}$/.test(code)) return { error: "请输入 6 位验证码" };
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return { error: "验证码错误或已失效" };
  const record = await latestResetCode(user.id);
  if (!record || record.consumedAt || record.attempts >= 5 || record.expiresAt.getTime() < Date.now()) return { error: "验证码错误或已失效" };
  if (!await bcrypt.compare(code, record.codeHash)) { await incrementResetAttempts(record.id); return { error: "验证码错误或已失效" }; }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.$transaction(async (tx) => { await tx.user.update({ where: { id: user.id }, data: { passwordHash } }); await consumeResetCode(record.id, tx); });
  return { success: "密码已重置，请返回登录" };
}
