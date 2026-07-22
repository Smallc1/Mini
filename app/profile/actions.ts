"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validations";
import { createManualPayment } from "@/lib/manual-payments";

async function userId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("请先登录");
  return session.user.id;
}

export async function createAddress(formData: FormData) {
  const id = await userId();
  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const count = await prisma.address.count({ where: { userId: id } });
  const makeDefault = count === 0 || formData.get("isDefault") === "on";
  await prisma.$transaction(async (tx) => {
    if (makeDefault) await tx.address.updateMany({ where: { userId: id }, data: { isDefault: false } });
    await tx.address.create({ data: { userId: id, ...parsed.data, isDefault: makeDefault } });
  });
  revalidatePath("/profile");
  revalidatePath("/checkout");
}

export async function setDefaultAddress(formData: FormData) {
  const id = await userId();
  const addressId = String(formData.get("addressId") || "");
  const owned = await prisma.address.findFirst({ where: { id: addressId, userId: id } });
  if (!owned) return;
  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId: id }, data: { isDefault: false } }),
    prisma.address.update({ where: { id: addressId }, data: { isDefault: true } }),
  ]);
  revalidatePath("/profile");
  revalidatePath("/checkout");
}

export async function deleteAddress(formData: FormData) {
  const id = await userId();
  const addressId = String(formData.get("addressId") || "");
  const address = await prisma.address.findFirst({ where: { id: addressId, userId: id } });
  if (!address) return;
  await prisma.address.delete({ where: { id: addressId } });
  if (address.isDefault) {
    const next = await prisma.address.findFirst({ where: { userId: id }, orderBy: { createdAt: "asc" } });
    if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }
  revalidatePath("/profile");
  revalidatePath("/checkout");
}

export async function rechargeBalance(formData: FormData) {
  const id = await userId();
  const amount = Number(formData.get("amount"));
  const provider = String(formData.get("provider") || "");
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) return;
  if (!["ALIPAY", "WECHAT"].includes(provider)) return;
  const cents = Math.round(amount * 100);
  if (cents < 1) return;
  const payment = await createManualPayment({ userId: id, kind: "RECHARGE", provider, amount: cents });
  redirect(`/payment/${payment.id}`);
}
