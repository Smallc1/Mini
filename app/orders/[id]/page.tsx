import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import OrderStatusBadge from "@/app/components/OrderStatusBadge";
import OrderCountdown from "../OrderCountdown";
import { cancelPendingOrder, payOrder, requestRefund, updatePendingOrderAddress } from "../actions";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ success?: string; created?: string; paymentError?: string; addressSaved?: string; addressError?: string; completed?: string; refundSubmitted?: string; refundError?: string; cancelled?: string; cancelError?: string }>;

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const { success, created, paymentError, addressSaved, addressError, completed, refundSubmitted, refundError, cancelled, cancelError } = await searchParams;

  await prisma.order.updateMany({
    where: { id, userId: session.user.id, status: "PENDING", createdAt: { lte: new Date(Date.now() - 30 * 60 * 1000) } },
    data: { status: "CANCELLED" },
  });

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, user: { select: { balance: true } } },
  });

  if (!order || order.userId !== session.user.id) notFound();
  if (order.userUnread) {
    await prisma.order.update({ where: { id: order.id }, data: { userUnread: false } });
  }
  const addresses = order.status === "PENDING"
    ? await prisma.address.findMany({ where: { userId: session.user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] })
    : [];
  const selectedAddress = addresses.find((item) => item.fullName === order.fullName && item.phone === order.phone && item.address === order.address)
    ?? addresses.find((item) => item.isDefault)
    ?? addresses[0];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {success && (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          🎉 支付成功，感谢您的下单！
        </div>
      )}
      {created && (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          订单已创建，当前状态为待付款。本次购买未加入购物车。
        </div>
      )}
      {paymentError && <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">支付失败，订单可能已超时、商品已下架或库存不足。</div>}
      {addressSaved && <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">收货地址已更新。</div>}
      {addressError && <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">收货地址更新失败，请重新选择。</div>}
      {completed && <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">订单已确认完成。</div>}
      {refundSubmitted && <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">售后申请已提交，等待管理员处理。</div>}
      {refundError && <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">请选择售后类型并填写原因。</div>}
      {cancelled && <div className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">订单已取消。</div>}
      {cancelError && <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">订单无法取消，可能已支付或已超时。</div>}

      <div className="flex items-center justify-between">
        <div>
          <Link href="/orders" className="text-sm text-slate-500 hover:text-slate-900">
            ← 全部订单
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">
            {order.items.map((item) => item.name).join("、")}
          </h1>
          <p className="text-sm text-slate-500">
            下单时间 {order.createdAt.toLocaleString("zh-CN")}
          </p>
        </div>
        <OrderStatusBadge status={order.refundStatus === "APPROVED" ? "COMPLETED" : order.status} />
      </div>

      {order.status === "PENDING" && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div><p className="font-semibold text-amber-900">请在 30 分钟内完成付款</p><OrderCountdown orderId={order.id} expiresAt={new Date(order.createdAt.getTime() + 30 * 60 * 1000).toISOString()} /></div>
          <div className="flex items-end gap-2"><form action={cancelPendingOrder}><input type="hidden" name="orderId" value={order.id} /><button className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-600 hover:bg-slate-100">取消订单</button></form><form action={payOrder} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="orderId" value={order.id} />
            <div className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm"><p className="mb-1 font-medium text-slate-700">选择支付方式</p><div className="flex flex-wrap gap-3"><label className="flex items-center gap-1"><input type="radio" name="paymentMethod" value="WECHAT" defaultChecked /> 微信支付</label><label className="flex items-center gap-1"><input type="radio" name="paymentMethod" value="ALIPAY" /> 支付宝</label><label className="flex items-center gap-1"><input type="radio" name="paymentMethod" value="BALANCE" /> 余额支付（{formatPrice(order.user.balance)}）</label></div></div>
            <button className="rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white shadow-sm hover:bg-orange-600">立即付款</button>
          </form></div>
        </div>
      )}
      {!success && ["PAID", "SHIPPED", "COMPLETED"].includes(order.status) && !order.refundStatus && (
        <form action={requestRefund} className="space-y-3 rounded-xl border border-rose-200 bg-rose-50/50 p-4">
          <input type="hidden" name="orderId" value={order.id} /><h2 className="font-semibold">申请售后</h2>
          <div className="flex gap-4 text-sm"><label><input type="radio" name="refundType" value="RETURN_REFUND" required /> 退货退款</label><label><input type="radio" name="refundType" value="REFUND_ONLY" required /> 仅退款</label></div>
          <textarea name="refundReason" required maxLength={300} rows={3} placeholder="请填写申请原因" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-rose-400" />
          <button className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700">提交申请</button>
        </form>
      )}
      {order.refundStatus && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm"><p className="font-semibold">售后申请：{order.refundType === "RETURN_REFUND" ? "退货退款" : "仅退款"}</p><p className="mt-1 text-slate-600">{order.refundReason}</p><p className="mt-2 font-medium text-amber-700">状态：{order.refundStatus === "PENDING" ? "待处理" : order.refundStatus === "APPROVED" ? "已同意" : "已拒绝"}</p>{order.refundReply && <p className="mt-2 rounded-lg bg-white/70 px-3 py-2 text-slate-700">管理员回复：{order.refundReply}</p>}</div>}

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="divide-y divide-slate-200 px-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between py-3">
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
        <div className="flex justify-between border-t border-slate-200 px-4 py-4 text-lg font-semibold">
          <span>合计</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>
      {order.status !== "PENDING" && <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"><span className="text-slate-500">支付方式：</span><span className="font-medium">{order.paymentMethod === "BALANCE" ? "账户余额" : order.paymentMethod === "WECHAT" ? "微信支付" : order.paymentMethod === "ALIPAY" ? "支付宝" : "未记录"}</span></div>}

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <h2 className="font-semibold">收货信息</h2>
        {order.status === "PENDING" && addresses.length > 0 && (
          <form action={updatePendingOrderAddress} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input type="hidden" name="orderId" value={order.id} />
            <select name="addressId" defaultValue={selectedAddress?.id} className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-violet-500">
              {addresses.map((item) => <option key={item.id} value={item.id}>{item.isDefault ? "[默认] " : ""}{item.fullName} · {item.phone} · {item.address}</option>)}
            </select>
            <button className="rounded-lg bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-700">使用此地址</button>
          </form>
        )}
        {order.status === "PENDING" && addresses.length === 0 && <Link href="/profile" className="mt-3 inline-block text-violet-600 hover:underline">请先到用户中心添加收货地址</Link>}
        <p className="mt-2 text-slate-600">{order.fullName}</p>
        <p className="text-slate-600">{order.address}</p>
        <p className="text-slate-600">{order.phone}</p>
      </div>
    </div>
  );
}
