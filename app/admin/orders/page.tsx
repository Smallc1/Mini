import { prisma } from "@/lib/prisma";
import AdminOrderRow from "./AdminOrderRow";
import { auth } from "@/auth";
import { getOrderReviews } from "@/lib/order-reviews";
import { isOwnerRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const session = await auth();
  const rows = await prisma.order.findMany({
    include: { items: true, user: { select: { email: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  const orders = rows.sort((a, b) => Number(b.refundStatus === "PENDING") - Number(a.refundStatus === "PENDING") || Number(b.adminUnread) - Number(a.adminUnread));
  const reviews = await getOrderReviews(orders.map((order) => order.id));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">订单管理（{orders.length}）</h2>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">订单</th>
              <th className="px-4 py-3 font-medium">客户</th>
              <th className="px-4 py-3 font-medium">下单日期</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium text-right">金额</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((o) => { const review = reviews.get(o.id); const canSeeReview = review?.reviewerRole !== "OWNER" || isOwnerRole(session?.user?.role); return <AdminOrderRow key={o.id} id={o.id} productNames={o.items.map((item) => item.name).join("、")} itemCount={o.items.reduce((sum, item) => sum + item.quantity, 0)} customerName={o.user.name || "未命名"} customerEmail={o.user.email} createdDate={o.createdAt.toLocaleDateString("zh-CN")} status={o.status} total={o.total} refundStatus={o.refundStatus} refundType={o.refundType} unread={o.adminUnread} paymentMethod={o.paymentMethod} reviewedBy={canSeeReview ? review?.reviewerName : null} reviewedAt={canSeeReview && review?.reviewedAt ? review.reviewedAt.toLocaleString("zh-CN") : null} />; })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  暂无订单。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
