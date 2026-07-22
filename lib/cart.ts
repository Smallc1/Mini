import { prisma } from "@/lib/prisma";

/** Number of distinct product types in a user's cart. */
export async function getCartCount(userId: string): Promise<number> {
  return prisma.cartItem.count({ where: { userId } });
}

/** Cart items with product data, for the cart page. */
export async function getCartItems(userId: string) {
  return prisma.cartItem.findMany({
    where: { userId },
    include: { product: { include: { category: true } } },
    orderBy: { createdAt: "asc" },
  });
}
