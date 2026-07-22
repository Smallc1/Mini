"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { applyMemberDiscount, getMembership } from "@/lib/utils";
import { notifyAdmins } from "@/lib/notifications";
import { formatPrice } from "@/lib/utils";
import { createManualPayment, findActiveOrderPayment } from "@/lib/manual-payments";

export async function buyNow(productId: string, quantity: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: "请先登录", needsLogin: true };
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { error: "购买数量必须是大于 0 的整数" };
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product || !product.isActive) throw new Error("商品已下架");
      if (quantity > product.stock) {
        throw new Error(`库存不足（仅剩 ${product.stock} 件）`);
      }
      const address = await tx.address.findFirst({
        where: { userId: session.user.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      });
      if (!address) throw new Error("请先在用户中心添加收货地址");
      const spent = await tx.order.aggregate({
        where: { userId: session.user.id, status: { in: ["PAID", "SHIPPED", "COMPLETED"] }, OR: [{ refundStatus: null }, { refundStatus: { in: ["PENDING", "REJECTED"] } }] },
        _sum: { total: true },
      });
      const membership = getMembership(spent._sum.total ?? 0);

      return tx.order.create({
        data: {
          userId: session.user.id,
          status: "PENDING",
          total: applyMemberDiscount(product.price * quantity, membership.discount),
          fullName: address.fullName,
          address: address.address,
          phone: address.phone,
          items: {
            create: {
              productId: product.id,
              name: product.name,
              priceAtPurchase: product.price,
              quantity,
            },
          },
        },
      });
    });

    revalidatePath("/orders");
    return { ok: true, orderId: order.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "创建订单失败" };
  }
}

export async function cancelExpiredOrder(orderId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "请先登录" };
  const deadline = new Date(Date.now() - 30 * 60 * 1000);
  await prisma.order.updateMany({
    where: { id: orderId, userId: session.user.id, status: "PENDING", createdAt: { lte: deadline } },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  return { ok: true };
}

export async function payOrder(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const orderId = String(formData.get("orderId") || "");
  const paymentMethod = String(formData.get("paymentMethod") || "");

  if (["ALIPAY", "WECHAT"].includes(paymentMethod)) {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId: session.user.id, status: "PENDING" } });
    if (!order || Date.now() >= order.createdAt.getTime() + 30 * 60 * 1000) redirect(`/orders/${orderId}?paymentError=1`);
    const existing = await findActiveOrderPayment(orderId);
    const payment = existing ?? await createManualPayment({ userId: session.user.id, orderId, kind: "ORDER", provider: paymentMethod, amount: order.total });
    redirect(`/payment/${payment.id}`);
  }

  if (paymentMethod !== "BALANCE") redirect(`/orders/${orderId}?paymentError=1`);

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, userId: session.user.id },
        include: { items: { include: { product: true } } },
      });
      if (!order) throw new Error("订单不存在");
      if (order.status !== "PENDING") throw new Error("订单已无法支付");
      if (Date.now() >= order.createdAt.getTime() + 30 * 60 * 1000) {
        await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
        throw new Error("订单已超时取消");
      }
      for (const item of order.items) {
        if (!item.product.isActive || item.quantity > item.product.stock) {
          throw new Error(`「${item.name}」库存不足或已下架`);
        }
      }
      const charged = await tx.user.updateMany({
        where: { id: session.user.id, balance: { gte: order.total } },
        data: { balance: { decrement: order.total } },
      });
      if (charged.count === 0) throw new Error("账户余额不足" );
      for (const item of order.items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
      }
      await tx.order.update({ where: { id: order.id }, data: { status: "PAID", paidAt: new Date(), paymentMethod } });
    });
  } catch {
    await prisma.order.updateMany({
      where: { id: orderId, userId: session.user.id, status: "PENDING", createdAt: { lte: new Date(Date.now() - 30 * 60 * 1000) } },
      data: { status: "CANCELLED" },
    });
    redirect(`/orders/${orderId}?paymentError=1`);
  }

  revalidatePath("/", "layout");
  const paidOrder = await prisma.order.findUnique({ where: { id: orderId }, include: { user: { select: { name: true, email: true } } } });
  if (paidOrder) await notifyAdmins("PAYMENT", "订单支付成功", `${paidOrder.user.name || paidOrder.user.email}支付了 ${formatPrice(paidOrder.total)}`, `/admin/orders/${orderId}`);
  revalidatePath("/orders");
  revalidatePath("/profile");
  revalidatePath(`/orders/${orderId}`);
  redirect(`/orders/${orderId}?success=1`);
}

export async function cancelPendingOrder(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const orderId = String(formData.get("orderId") || "");
  const updated = await prisma.order.updateMany({
    where: { id: orderId, userId: session.user.id, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  redirect(`/orders/${orderId}?${updated.count > 0 ? "cancelled=1" : "cancelError=1"}`);
}

export async function updatePendingOrderAddress(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const orderId = String(formData.get("orderId") || "");
  const addressId = String(formData.get("addressId") || "");
  const address = await prisma.address.findFirst({ where: { id: addressId, userId: session.user.id } });
  if (!address) redirect(`/orders/${orderId}?addressError=1`);

  const updated = await prisma.order.updateMany({
    where: { id: orderId, userId: session.user.id, status: "PENDING" },
    data: { fullName: address.fullName, phone: address.phone, address: address.address },
  });
  if (updated.count === 0) redirect(`/orders/${orderId}?addressError=1`);
  revalidatePath(`/orders/${orderId}`);
  redirect(`/orders/${orderId}?addressSaved=1`);
}

export async function confirmOrderCompleted(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const orderId = String(formData.get("orderId") || "");
  await prisma.order.updateMany({
    where: { id: orderId, userId: session.user.id, status: { in: ["PAID", "SHIPPED"] } },
    data: { status: "COMPLETED", adminUnread: true },
  });
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/admin/orders");
  redirect(`/orders/${orderId}?completed=1`);
}

export async function requestRefund(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const orderId = String(formData.get("orderId") || "");
  const refundType = String(formData.get("refundType") || "");
  const refundReason = String(formData.get("refundReason") || "").trim();
  if (!["RETURN_REFUND", "REFUND_ONLY"].includes(refundType) || !refundReason) redirect(`/orders/${orderId}?refundError=1`);
  await prisma.order.updateMany({
    where: { id: orderId, userId: session.user.id, status: { in: ["PAID", "SHIPPED", "COMPLETED"] }, refundStatus: null },
    data: { refundType, refundReason: refundReason.slice(0, 300), refundStatus: "PENDING", adminUnread: true },
  });
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/admin/orders");
  redirect(`/orders/${orderId}?refundSubmitted=1`);
}
