import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import OrderStatusBadge from "@/app/components/OrderStatusBadge";
import OrderCountdown from "./OrderCountdown";
import { confirmOrderCompleted } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ highlight?: string }>;

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/orders");
  const { highlight } = await searchParams;

  await prisma.order.updateMany({
    where: { userId: session.user.id, status: "PENDING", createdAt: { lte: new Date(Date.now() - 30 * 60 * 1000) } },
    data: { status: "CANCELLED" },
  });

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">全部订单</h1>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <p className="text-slate-500">你还没有任何订单。</p>
          <Link
            href="/products"
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
          >
            去购物
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const itemCount = order.items.reduce(
              (n, i) => n + i.quantity,
              0
            );
            return (
              <div id={`order-${order.id}`} key={order.id} className={`flex min-w-0 scroll-mt-24 flex-col gap-2 rounded-xl border bg-white p-2 transition sm:flex-row sm:items-center sm:gap-3 ${highlight === order.id ? "border-amber-400 bg-amber-50 ring-4 ring-amber-100" : "border-slate-200 hover:border-slate-900"}`}>
              <Link
                href={`/orders/${order.id}`}
                className="flex min-w-0 flex-1 flex-col gap-2 rounded-lg p-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{order.items.map((item) => item.name).join("、")}</p>
                  <p className="text-sm text-slate-500">
                    {order.createdAt.toLocaleDateString("zh-CN")} · 共 {itemCount} 件
                  </p>
                  <p className="text-xs text-slate-400">支付方式：{order.status === "PENDING" ? "待选择" : order.paymentMethod === "BALANCE" ? "账户余额" : order.paymentMethod === "WECHAT" ? "微信支付" : order.paymentMethod === "ALIPAY" ? "支付宝" : "未记录"}</p>
                  {order.status === "PENDING" && <OrderCountdown orderId={order.id} expiresAt={new Date(order.createdAt.getTime() + 30 * 60 * 1000).toISOString()} />}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:gap-4">
                  {order.refundStatus === "APPROVED" && <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">退款已通过</span>}
                  {order.refundStatus === "REJECTED" && <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700">退款已拒绝</span>}
                  {order.userUnread && <span className="inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" title="未读售后通知" />}
                  <OrderStatusBadge status={order.refundStatus === "APPROVED" ? "COMPLETED" : order.status} />
                  <span className="font-semibold">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </Link>
              {["PAID", "SHIPPED"].includes(order.status) && (
                <form action={confirmOrderCompleted} className="shrink-0 px-2 pb-2 sm:px-0 sm:pb-0"><input type="hidden" name="orderId" value={order.id} /><button className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">确认收货并完成订单</button></form>
              )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
