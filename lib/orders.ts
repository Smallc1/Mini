import { prisma } from "@/lib/prisma";

const AUTO_COMPLETE_DAYS = 10;

export async function autoCompleteOrders(userId?: string) {
  const deadline = new Date(Date.now() - AUTO_COMPLETE_DAYS * 24 * 60 * 60 * 1000);
  return prisma.order.updateMany({
    where: {
      ...(userId ? { userId } : {}),
      status: { in: ["PAID", "SHIPPED"] },
      OR: [
        { paidAt: { lte: deadline } },
        { paidAt: null, updatedAt: { lte: deadline } },
      ],
    },
    data: { status: "COMPLETED", adminUnread: true },
  });
}
