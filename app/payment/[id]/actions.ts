"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyAdmins } from "@/lib/notifications";
import { formatPrice } from "@/lib/utils";
import { findOwnedManualPayment, updateManualPaymentStatus } from "@/lib/manual-payments";

export async function submitManualPayment(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const paymentId = String(formData.get("paymentId") || "");
  const payment = await findOwnedManualPayment(paymentId, session.user.id);
  if (!payment) redirect("/");
  if (payment.status === "CREATED") {
    await updateManualPaymentStatus(payment.id, "CREATED", "SUBMITTED", "submittedAt");
    await notifyAdmins("MANUAL_PAYMENT", "待确认收款", `${payment.kind === "ORDER" ? "订单付款" : "余额充值"} ${formatPrice(payment.amount)}，请核对收款记录`, "/admin/payments");
  }
  revalidatePath(`/payment/${payment.id}`);
  redirect(`/payment/${payment.id}?submitted=1`);
}
