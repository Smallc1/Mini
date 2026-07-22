"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkoutSchema } from "@/lib/validations";
import { applyMemberDiscount, getMembership } from "@/lib/utils";

export type CheckoutState = { error?: string } | undefined;

export async function placeOrder(
  _prev: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/checkout");
  const userId = session.user.id;
  const selectedIds = String(formData.get("selectedIds") || "").split(",").filter(Boolean);
  if (selectedIds.length === 0) return { error: "请选择要结算的商品" };

  const addressId = String(formData.get("addressId") || "");
  const savedAddress = addressId && addressId !== "new"
    ? await prisma.address.findFirst({ where: { id: addressId, userId } })
    : null;
  const parsed = checkoutSchema.safeParse(savedAddress ?? {
    fullName: formData.get("fullName"), address: formData.get("address"), phone: formData.get("phone"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "输入有误" };
  }

  let orderId: string;

  try {
    orderId = await prisma.$transaction(async (tx) => {
      const cartItems = await tx.cartItem.findMany({
        where: { userId, id: { in: selectedIds } },
        include: { product: true },
      });

      if (cartItems.length === 0) {
        throw new Error("购物车是空的");
      }

      // Verify stock and compute total from current DB prices.
      let total = 0;
      for (const item of cartItems) {
        if (item.quantity > item.product.stock) {
          throw new Error(
            `「${item.product.name}」库存不足（仅剩 ${item.product.stock} 件）`
          );
        }
        total += item.product.price * item.quantity;
      }
      const spent = await tx.order.aggregate({
        where: { userId, status: { in: ["PAID", "SHIPPED", "COMPLETED"] }, OR: [{ refundStatus: null }, { refundStatus: { in: ["PENDING", "REJECTED"] } }] },
        _sum: { total: true },
      });
      total = applyMemberDiscount(total, getMembership(spent._sum.total ?? 0).discount);

      // Create a pending order. Stock is deducted only when payment succeeds.
      const order = await tx.order.create({
        data: {
          userId,
          status: "PENDING",
          total,
          fullName: parsed.data.fullName,
          address: parsed.data.address,
          phone: parsed.data.phone,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              name: item.product.name,
              priceAtPurchase: item.product.price,
              quantity: item.quantity,
            })),
          },
        },
      });

      // Clear the cart.
      await tx.cartItem.deleteMany({ where: { userId, id: { in: cartItems.map((item) => item.id) } } });

      return order.id;
    });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "下单失败，请稍后重试",
    };
  }

  revalidatePath("/", "layout");
  revalidatePath("/orders");
  redirect(`/orders/${orderId}?created=1`);
}
