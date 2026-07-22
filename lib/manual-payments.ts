import { randomUUID } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type DbClient = PrismaClient | Prisma.TransactionClient;
export type ManualPayment = { id: string; userId: string; orderId: string | null; kind: string; provider: string; amount: number; status: string; createdAt: Date; submittedAt: Date | null; reviewedAt: Date | null; reviewedByName: string | null; reviewedByRole: string | null };

export async function createManualPayment(data: Pick<ManualPayment, "userId" | "kind" | "provider" | "amount"> & { orderId?: string }, db: DbClient = prisma) {
  const id = randomUUID(); const now = new Date();
  await db.$executeRawUnsafe("INSERT INTO ManualPayment (id,userId,orderId,kind,provider,amount,status,createdAt) VALUES (?,?,?,?,?,?,?,?)", id, data.userId, data.orderId ?? null, data.kind, data.provider, data.amount, "CREATED", now);
  return { id, ...data, orderId: data.orderId ?? null, status: "CREATED", createdAt: now, submittedAt: null, reviewedAt: null, reviewedByName: null, reviewedByRole: null } satisfies ManualPayment;
}
export async function findOwnedManualPayment(id: string, userId: string, db: DbClient = prisma) { const rows = await db.$queryRawUnsafe<ManualPayment[]>("SELECT * FROM ManualPayment WHERE id=? AND userId=? LIMIT 1", id, userId); return rows[0] ?? null; }
export async function findManualPayment(id: string, db: DbClient = prisma) { const rows = await db.$queryRawUnsafe<ManualPayment[]>("SELECT * FROM ManualPayment WHERE id=? LIMIT 1", id); return rows[0] ?? null; }
export async function findActiveOrderPayment(orderId: string, db: DbClient = prisma) { const rows = await db.$queryRawUnsafe<ManualPayment[]>("SELECT * FROM ManualPayment WHERE orderId=? AND status IN ('CREATED','SUBMITTED') ORDER BY createdAt DESC LIMIT 1", orderId); return rows[0] ?? null; }
export async function updateManualPaymentStatus(id: string, from: string, status: string, dateField: "submittedAt" | "reviewedAt", db: DbClient = prisma) { return db.$executeRawUnsafe(`UPDATE ManualPayment SET status=?, ${dateField}=? WHERE id=? AND status=?`, status, new Date(), id, from); }
export async function saveManualPaymentReviewer(id: string, name: string, role: string, db: DbClient = prisma) { return db.$executeRawUnsafe("UPDATE ManualPayment SET reviewedByName=?, reviewedByRole=? WHERE id=?", name, role, id); }
export async function countSubmittedManualPayments() { const rows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>("SELECT COUNT(*) AS count FROM ManualPayment WHERE status='SUBMITTED'"); return Number(rows[0]?.count ?? 0); }
export type ManualPaymentWithUser = ManualPayment & { userName: string | null; userEmail: string };
export async function listManualPayments() { return prisma.$queryRawUnsafe<ManualPaymentWithUser[]>("SELECT p.*,u.name AS userName,u.email AS userEmail FROM ManualPayment p JOIN User u ON u.id=p.userId ORDER BY CASE p.status WHEN 'SUBMITTED' THEN 0 WHEN 'CREATED' THEN 1 ELSE 2 END,p.createdAt DESC LIMIT 200"); }
