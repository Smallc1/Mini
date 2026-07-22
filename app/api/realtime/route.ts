import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ authenticated: false }, { headers: { "Cache-Control": "no-store" } });
  }

  const userId = session.user.id;
  const isAdmin = isAdminRole(session.user.role);
  const [account, unreadNotifications, latestNotification, latestOrder, unreadOrders, latestSupport, unreadSupport] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { sessionVersion: true, isDisabled: true } }),
    prisma.notification.count({ where: { recipientId: userId, isRead: false } }),
    prisma.notification.findFirst({ where: { recipientId: userId }, orderBy: { createdAt: "desc" }, select: { id: true, createdAt: true } }),
    prisma.order.findFirst({ where: isAdmin ? {} : { userId }, orderBy: { updatedAt: "desc" }, select: { id: true, updatedAt: true } }),
    prisma.order.count({ where: isAdmin ? { adminUnread: true } : { userId, userUnread: true } }),
    prisma.supportMessage.findFirst({ where: isAdmin ? {} : { userId }, orderBy: { createdAt: "desc" }, select: { id: true, createdAt: true } }),
    prisma.supportMessage.count({ where: isAdmin ? { readByAdmin: false } : { userId, readByUser: false } }),
  ]);

  if (!account || account.isDisabled || account.sessionVersion !== session.user.sessionVersion) {
    return NextResponse.json({ authenticated: false, forcedLogout: true }, { headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json({
    authenticated: true,
    unreadNotifications,
    latestNotification: latestNotification ? `${latestNotification.id}:${latestNotification.createdAt.getTime()}` : null,
    latestOrder: latestOrder ? `${latestOrder.id}:${latestOrder.updatedAt.getTime()}` : null,
    unreadOrders,
    latestSupport: latestSupport ? `${latestSupport.id}:${latestSupport.createdAt.getTime()}` : null,
    unreadSupport,
  }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
