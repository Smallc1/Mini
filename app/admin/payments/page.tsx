import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { reviewManualPayment } from "./actions";
import { listManualPayments } from "@/lib/manual-payments";
import { auth } from "@/auth";
import { isOwnerRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const session = await auth();
  const payments = await listManualPayments();
  return <div className="space-y-4"><div><h2 className="text-lg font-semibold">收款审核</h2><p className="mt-1 text-sm text-slate-500">请先在微信或支付宝账单中核对金额和付款人，再确认到账。</p></div><div className="space-y-3">{payments.map((payment) => { const canSeeReviewer = payment.reviewedByRole !== "OWNER" || isOwnerRole(session?.user?.role); return <div key={payment.id} className={`rounded-xl border p-4 ${payment.status === "SUBMITTED" ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="font-semibold">{payment.kind === "ORDER" ? "订单付款" : "余额充值"} · {payment.provider === "WECHAT" ? "微信" : "支付宝"}</p><p className="mt-1 text-sm text-slate-600">{payment.userName || payment.userEmail} · <span className="font-bold text-orange-600">{formatPrice(payment.amount)}</span></p><p className="mt-1 text-xs text-slate-400">提交时间：{(payment.submittedAt || payment.createdAt).toLocaleString("zh-CN")}{payment.orderId && <> · <Link href={`/admin/orders/${payment.orderId}`} className="text-violet-600">查看订单</Link></>}</p>{canSeeReviewer && payment.reviewedByName && <p className="mt-1 text-xs text-emerald-700">审核人：{payment.reviewedByName}（{payment.reviewedByRole === "OWNER" ? "站长" : "管理员"}）{payment.reviewedAt ? ` · ${payment.reviewedAt.toLocaleString("zh-CN")}` : ""}</p>}</div>{payment.status === "SUBMITTED" ? <form action={reviewManualPayment} className="flex gap-2"><input type="hidden" name="paymentId" value={payment.id} /><button name="decision" value="reject" className="rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm text-rose-600">未到账</button><button name="decision" value="approve" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white">确认到账</button></form> : <span className={`rounded-full px-3 py-1 text-xs ${payment.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : payment.status === "REJECTED" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"}`}>{payment.status === "APPROVED" ? "已到账" : payment.status === "REJECTED" ? "未通过" : "用户尚未提交"}</span>}</div></div>; })}{payments.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-400">暂无付款记录</div>}</div></div>;
}
