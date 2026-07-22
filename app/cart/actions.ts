"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

export async function addToCart(productId: string, quantity = 1) {
  const userId = await requireUserId();

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { error: "商品不存在" };
  if (!product.isActive) return { error: "商品已下架" };
  if (product.stock < 1) return { error: "商品已售罄" };

  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  const desired = (existing?.quantity ?? 0) + quantity;
  const capped = Math.min(desired, product.stock);

  await prisma.cartItem.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId, quantity: capped },
    update: { quantity: capped },
  });

  revalidatePath("/cart");
  revalidatePath("/", "layout");
  const cartCategoryCount = await prisma.cartItem.count({ where: { userId } });
  return { ok: true, cartCategoryCount };
}

export async function updateCartItem(itemId: string, quantity: number) {
  const userId = await requireUserId();

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { product: true },
  });
  if (!item || item.userId !== userId) return { error: "购物车中未找到该商品" };

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    const capped = Math.min(quantity, item.product.stock);
    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: capped },
    });
  }

  revalidatePath("/cart");
  revalidatePath("/", "layout");
  const cartCategoryCount = await prisma.cartItem.count({ where: { userId } });
  return { ok: true, cartCategoryCount };
}

export async function removeCartItem(itemId: string) {
  const userId = await requireUserId();
  const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== userId) return { error: "购物车中未找到该商品" };

  await prisma.cartItem.delete({ where: { id: itemId } });
  revalidatePath("/cart");
  revalidatePath("/", "layout");
  const cartCategoryCount = await prisma.cartItem.count({ where: { userId } });
  return { ok: true, cartCategoryCount };
}
