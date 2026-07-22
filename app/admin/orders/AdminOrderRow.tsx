"use client";

import { useRouter } from "next/navigation";
import OrderStatusBadge from "@/app/components/OrderStatusBadge";
import { formatPrice } from "@/lib/utils";

type Props = {
  id: string;
  productNames: string;
  itemCount: number;
  customerName: string;
  customerEmail: string;
  createdDate: string;
  status: string;
  total: number;
  refundStatus: string | null;
  refundType: string | null;
  unread: boolean;
  paymentMethod: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
};

export default function AdminOrderRow(props: Props) {
  const router = useRouter();
  const open = () => router.push(`/admin/orders/${props.id}`);

  return (
    <tr
      role="link"
      tabIndex={0}
      aria-label={`处理订单：${props.productNames}`}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      }}
      className="cursor-pointer transition hover:bg-indigo-50/70 focus:bg-indigo-50 focus:outline-none"
    >
      <td className="px-4 py-3">
        <span className="font-medium text-indigo-600">{props.productNames}</span>
        <p className="text-xs text-slate-400">共 {props.itemCount} 件</p>
        <p className="text-xs text-slate-400">支付：{props.paymentMethod === "BALANCE" ? "账户余额" : props.paymentMethod === "WECHAT" ? "微信支付" : props.paymentMethod === "ALIPAY" ? "支付宝" : "未记录"}</p>
        {props.refundStatus === "PENDING" && <span className="mt-1 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">{props.refundType === "RETURN_REFUND" ? "退货退款" : "仅退款"} · 待处理</span>}
        {props.reviewedBy && <p className="mt-1 text-xs text-emerald-700">{props.refundStatus === "APPROVED" ? "审核通过" : "审核处理"}：{props.reviewedBy}{props.reviewedAt ? ` · ${props.reviewedAt}` : ""}</p>}
        {props.unread && <span className="ml-1 inline-flex h-2 w-2 rounded-full bg-rose-500" title="未读通知" />}
      </td>
      <td className="px-4 py-3 text-slate-600"><p>{props.customerName}</p><p className="text-xs text-slate-400">{props.customerEmail}</p></td>
      <td className="px-4 py-3 text-slate-500">{props.createdDate}</td>
      <td className="px-4 py-3"><OrderStatusBadge status={props.status} /></td>
      <td className="px-4 py-3 text-right font-medium">{formatPrice(props.total)}</td>
    </tr>
  );
}
