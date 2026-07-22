import { randomUUID } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type DbClient = PrismaClient | Prisma.TransactionClient;
export const normalizePhone = (value: string) => value.trim().replace(/[\s-]/g, "");

export async function findUserIdByPhone(phone: string, db: DbClient = prisma) {
  const rows = await db.$queryRawUnsafe<Array<{ id: string }>>("SELECT id FROM User WHERE phone=? LIMIT 1", normalizePhone(phone));
  return rows[0]?.id ?? null;
}
export async function setUserPhone(userId: string, phone: string, db: DbClient = prisma) {
  return db.$executeRawUnsafe("UPDATE User SET phone=? WHERE id=?", normalizePhone(phone), userId);
}

export type ResetCodeRow = { id: string; userId: string; codeHash: string; expiresAt: Date; attempts: number; consumedAt: Date | null; createdAt: Date };
export async function latestResetCode(userId: string, db: DbClient = prisma) {
  const rows = await db.$queryRawUnsafe<ResetCodeRow[]>("SELECT * FROM PasswordResetCode WHERE userId=? ORDER BY createdAt DESC LIMIT 1", userId);
  return rows[0] ?? null;
}
export async function createResetCode(userId: string, codeHash: string, expiresAt: Date, db: DbClient = prisma) {
  const id = randomUUID();
  await db.$executeRawUnsafe("INSERT INTO PasswordResetCode (id,userId,codeHash,expiresAt,attempts,createdAt) VALUES (?,?,?,?,0,?)", id, userId, codeHash, expiresAt, new Date());
  return id;
}
export async function incrementResetAttempts(id: string, db: DbClient = prisma) { return db.$executeRawUnsafe("UPDATE PasswordResetCode SET attempts=attempts+1 WHERE id=?", id); }
export async function consumeResetCode(id: string, db: DbClient = prisma) { return db.$executeRawUnsafe("UPDATE PasswordResetCode SET consumedAt=? WHERE id=? AND consumedAt IS NULL", new Date(), id); }
