"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function openNotification(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/notifications");

  const ids = String(formData.get("notificationIds") || "").split(",").filter(Boolean).slice(0, 100);
  const requestedLink = String(formData.get("link") || "");
  let safeLink = requestedLink.startsWith("/") && !requestedLink.startsWith("//") ? requestedLink : "/notifications";

  // Backward compatibility for payment notifications created before order highlighting was added.
  if (safeLink === "/orders" && ids[0]) {
    const notification = await prisma.notification.findFirst({ where: { id: ids[0], recipientId: session.user.id, type: "PAYMENT_REVIEW" }, select: { createdAt: true } });
    if (notification) {
      const matches = await prisma.$queryRawUnsafe<Array<{ orderId: string }>>("SELECT orderId FROM ManualPayment WHERE userId=? AND kind='ORDER' AND status='APPROVED' AND orderId IS NOT NULL ORDER BY ABS(reviewedAt-?) LIMIT 1", session.user.id, notification.createdAt);
      const orderId = matches[0]?.orderId;
      if (orderId) safeLink = `/orders?highlight=${orderId}#order-${orderId}`;
    }
  }

  if (ids.length > 0) {
    await prisma.notification.updateMany({
      where: { id: { in: ids }, recipientId: session.user.id, isRead: false },
      data: { isRead: true },
    });
  }

  redirect(safeLink);
}
