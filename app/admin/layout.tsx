import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminNav from "./AdminNav";
import { prisma } from "@/lib/prisma";
import { countSubmittedManualPayments } from "@/lib/manual-payments";
import { isAdminRole } from "@/lib/roles";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!isAdminRole(session?.user?.role)) redirect("/");
  const [unreadCount, paymentCount, userCount] = await Promise.all([
    prisma.order.count({ where: { adminUnread: true } }),
    countSubmittedManualPayments(),
    prisma.notification.count({ where: { recipientId: session.user.id, type: "USER_REGISTER", isRead: false } }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">后台管理</h1>
      <div className="flex min-w-0 flex-col gap-6 md:flex-row">
        <AdminNav unreadCount={unreadCount} paymentCount={paymentCount} userCount={userCount} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
