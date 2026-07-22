import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type DbClient = PrismaClient | Prisma.TransactionClient;
export type OrderReview = { orderId: string; reviewerName: string | null; reviewerRole: string | null; reviewedAt: Date | null };

export async function saveOrderReview(orderId: string, reviewerName: string, reviewerRole: string, db: DbClient = prisma) {
  return db.$executeRawUnsafe("UPDATE `Order` SET refundReviewedByName=?, refundReviewedByRole=?, refundReviewedAt=? WHERE id=?", reviewerName, reviewerRole, new Date(), orderId);
}

export async function getOrderReviews(orderIds: string[]) {
  if (orderIds.length === 0) return new Map<string, OrderReview>();
  const placeholders = orderIds.map(() => "?").join(",");
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string; refundReviewedByName: string | null; refundReviewedByRole: string | null; refundReviewedAt: Date | null }>>(`SELECT id,refundReviewedByName,refundReviewedByRole,refundReviewedAt FROM \`Order\` WHERE id IN (${placeholders})`, ...orderIds);
  return new Map(rows.map((row) => [row.id, { orderId: row.id, reviewerName: row.refundReviewedByName, reviewerRole: row.refundReviewedByRole, reviewedAt: row.refundReviewedAt }]));
}
