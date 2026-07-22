import { prisma } from "@/lib/prisma";
import { formatPrice, getMembership } from "@/lib/utils";
import UserStatusButton from "./UserStatusButton";
import { auth } from "@/auth";
import UserRoleButton from "./UserRoleButton";
import { isAdminRole, isOwnerRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await auth();
  if (session?.user?.id) await prisma.notification.updateMany({ where: { recipientId: session.user.id, type: "USER_REGISTER", isRead: false }, data: { isRead: true } });
  const users = await prisma.user.findMany({
    include: { orders: { select: { total: true, status: true, refundStatus: true, createdAt: true } } },
    orderBy: { createdAt: "desc" },
  });
  return <div className="space-y-4"><h2 className="text-lg font-semibold">用户管理（{users.length}）</h2><div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full text-sm"><thead className="border-b bg-slate-50 text-left text-slate-500"><tr><th className="px-4 py-3">用户</th><th className="px-4 py-3">注册时间</th><th className="px-4 py-3">订单/消费</th><th className="px-4 py-3">等级</th><th className="px-4 py-3">状态</th><th className="px-4 py-3">操作</th></tr></thead><tbody className="divide-y divide-slate-100">{users.map((user) => { const paid = user.orders.filter((order) => ["PAID", "SHIPPED", "COMPLETED"].includes(order.status) && order.refundStatus !== "APPROVED"); const spent = paid.reduce((sum, order) => sum + order.total, 0); const member = user.role === "OWNER" ? "站长" : user.role === "ADMIN" ? "管理员" : getMembership(spent).label; const userName = user.name || user.email; const isOwner = isOwnerRole(session?.user?.role); const canRemove = !isOwnerRole(user.role) && (isOwner || !isAdminRole(user.role)); return <tr key={user.id}><td className="px-4 py-3"><p className="font-medium">{user.name || "未命名"}</p><p className="text-xs text-slate-500">{user.email}</p></td><td className="px-4 py-3 text-slate-500">{user.createdAt.toLocaleString("zh-CN")}</td><td className="px-4 py-3">{user.orders.length} 笔 · <span className="font-medium text-orange-500">{formatPrice(spent)}</span></td><td className="px-4 py-3 text-violet-600">{member}</td><td className="px-4 py-3">{user.isDisabled ? <span className="text-rose-600">已禁用</span> : <span className="text-emerald-600">正常</span>}</td><td className="px-4 py-3"><div className="flex flex-wrap gap-2">{user.id === session?.user?.id ? <span className="px-2 py-2 text-xs text-slate-400">{isOwnerRole(user.role) ? "当前站长" : "当前管理员"}</span> : isOwnerRole(user.role) ? <span className="px-2 py-2 text-xs font-medium text-amber-600">站长</span> : <>{isOwner && <UserRoleButton id={user.id} initialAdmin={user.role === "ADMIN"} userName={userName} />}{canRemove && <UserStatusButton id={user.id} initialDisabled={user.isDisabled} userName={userName} />}{!isOwner && isAdminRole(user.role) && <span className="px-2 py-2 text-xs text-slate-400">管理员</span>}</>}</div></td></tr>; })}</tbody></table></div></div>;
}
