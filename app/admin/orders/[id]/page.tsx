import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import StatusSelect from "./StatusSelect";
import RefundActions from "./RefundActions";
import { auth } from "@/auth";
import { getOrderReviews } from "@/lib/order-reviews";
import { isOwnerRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const session = await auth();
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, user: { select: { email: true, name: true } } },
  });

  if (!order) notFound();
  const review = (await getOrderReviews([order.id])).get(order.id);
  const canSeeReview = review?.reviewerRole !== "OWNER" || isOwnerRole(session?.user?.role);
  if (order.adminUnread) {
    await prisma.order.update({ where: { id: order.id }, data: { adminUnread: false } });
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/orders"
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ← 全部订单
        </Link>
        <h2 className="mt-1 text-lg font-semibold">
          订单号 #{order.id.slice(-8)}
        </h2>
        <p className="text-sm text-slate-500">
          {order.createdAt.toLocaleString("zh-CN")} · {order.user.email}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div><span className="text-sm font-medium">订单状态</span><p className="mt-1 text-xs text-slate-500">支付方式：{order.paymentMethod === "BALANCE" ? "账户余额" : order.paymentMethod === "WECHAT" ? "微信支付" : order.paymentMethod === "ALIPAY" ? "支付宝" : "未记录"}</p></div>
          <StatusSelect orderId={order.id} current={order.status} />
        </div>
      </div>
      {order.refundStatus && <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-5"><h3 className="font-semibold text-rose-800">售后申请：{order.refundType === "RETURN_REFUND" ? "退货退款" : "仅退款"}</h3><p className="text-sm text-slate-700">{order.refundReason}</p><p className="text-sm font-medium">处理状态：{order.refundStatus === "PENDING" ? "待处理" : order.refundStatus === "APPROVED" ? "已同意" : "已拒绝"}</p>{canSeeReview && review?.reviewerName && <p className="text-sm text-emerald-700">审核人：{review.reviewerName}（{review.reviewerRole === "OWNER" ? "站长" : "管理员"}）{review.reviewedAt ? ` · ${review.reviewedAt.toLocaleString("zh-CN")}` : ""}</p>}{order.refundReply && <p className="rounded-lg bg-white/70 px-3 py-2 text-sm text-slate-700">处理说明：{order.refundReply}</p>}{order.refundStatus === "PENDING" && <RefundActions orderId={order.id} />}</div>}

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="divide-y divide-slate-100 px-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between py-3 text-sm">
              <span>
                {item.name}{" "}
                <span className="text-slate-400">× {item.quantity}</span>
              </span>
              <span className="font-medium">
                {formatPrice(item.priceAtPurchase * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-between border-t border-slate-200 px-4 py-4 font-semibold">
          <span>合计</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <h3 className="font-semibold">收货信息</h3>
        <p className="mt-2 text-slate-600">{order.fullName}</p>
        <p className="text-slate-600">{order.address}</p>
        <p className="text-slate-600">{order.phone}</p>
      </div>
    </div>
  );
}
