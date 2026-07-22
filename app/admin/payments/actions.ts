"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { findManualPayment, saveManualPaymentReviewer, updateManualPaymentStatus } from "@/lib/manual-payments";
import { isAdminRole } from "@/lib/roles";

export async function reviewManualPayment(formData: FormData) {
  const session = await auth();
  if (!isAdminRole(session?.user?.role)) return;
  const reviewerName = session.user.name || session.user.email || "管理员";
  const paymentId = String(formData.get("paymentId") || "");
  const approved = formData.get("decision") === "approve";

  await prisma.$transaction(async (tx) => {
    const payment = await findManualPayment(paymentId, tx);
    if (!payment || payment.status !== "SUBMITTED") return;
    if (!approved) {
      await updateManualPaymentStatus(payment.id, "SUBMITTED", "REJECTED", "reviewedAt", tx);
      await saveManualPaymentReviewer(payment.id, reviewerName, session.user.role, tx);
      await tx.notification.create({ data: { recipientId: payment.userId, type: "PAYMENT_REVIEW", title: "付款审核未通过", content: "未查询到对应收款，请联系客服", link: payment.kind === "ORDER" && payment.orderId ? `/orders/${payment.orderId}` : "/profile" } });
      return;
    }
    if (payment.kind === "RECHARGE") {
      await tx.user.update({ where: { id: payment.userId }, data: { balance: { increment: payment.amount } } });
    } else {
      const order = payment.orderId ? await tx.order.findUnique({ where: { id: payment.orderId }, include: { items: { include: { product: true } } } }) : null;
      if (!order || order.status !== "PENDING" || order.total !== payment.amount) throw new Error("订单状态或金额异常");
      for (const item of order.items) {
        if (!item.product.isActive || item.product.stock < item.quantity) throw new Error(`商品「${item.name}」库存不足`);
        await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
      }
      await tx.order.update({ where: { id: order.id }, data: { status: "PAID", paidAt: new Date(), paymentMethod: payment.provider, adminUnread: true, userUnread: true } });
    }
    await updateManualPaymentStatus(payment.id, "SUBMITTED", "APPROVED", "reviewedAt", tx);
    await saveManualPaymentReviewer(payment.id, reviewerName, session.user.role, tx);
    await tx.notification.create({ data: { recipientId: payment.userId, type: "PAYMENT_REVIEW", title: payment.kind === "ORDER" ? "付款已确认，等待收货完成订单" : "充值已确认", content: payment.kind === "ORDER" ? "订单付款已处理完成，可前往全部订单查看" : "充值已处理完成", link: payment.kind === "ORDER" && payment.orderId ? `/orders?highlight=${payment.orderId}#order-${payment.orderId}` : "/profile" } });
  });
  revalidatePath("/admin/payments");
  revalidatePath("/admin/orders");
  revalidatePath("/orders");
  revalidatePath("/profile");
}
