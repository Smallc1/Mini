import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { submitManualPayment } from "./actions";
import { findOwnedManualPayment } from "@/lib/manual-payments";

type Params = Promise<{ id: string }>;

export default async function ManualPaymentPage({ params }: { params: Params }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;
  const payment = await findOwnedManualPayment(id, session.user.id);
  if (!payment) redirect("/");
  const providerName = payment.provider === "WECHAT" ? "微信支付" : "支付宝";
  const imageSrc = payment.provider === "WECHAT" ? "/payment/wechat.jpg" : "/payment/alipay.jpg";

  return <div className="mx-auto max-w-xl space-y-5"><div><h1 className="text-2xl font-semibold">{providerName}</h1><p className="mt-1 text-sm text-slate-500">收款账号：18179518955</p></div><div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm"><p className="text-sm text-slate-500">{payment.kind === "ORDER" ? "订单付款" : "余额充值"}</p><p className="mt-2 text-3xl font-bold text-orange-500">{formatPrice(payment.amount)}</p><div className="mx-auto mt-5 max-w-sm overflow-hidden rounded-2xl border border-slate-200"><Image src={imageSrc} alt={`${providerName}收款码`} width={1260} height={1890} className="h-auto w-full" priority /></div>{payment.status === "CREATED" ? <form action={submitManualPayment} className="mt-6"><input type="hidden" name="paymentId" value={payment.id} /><button className="w-full rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700">我已完成付款，提交审核</button><p className="mt-3 text-xs text-slate-400">请确认实际付款金额与上方金额一致。提交后由管理员核对到账。</p></form> : <div className={`mt-6 rounded-xl px-4 py-3 text-sm ${payment.status === "APPROVED" ? "bg-emerald-50 text-emerald-700" : payment.status === "REJECTED" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>{payment.status === "APPROVED" ? "付款已确认，处理完成" : payment.status === "REJECTED" ? "付款审核未通过，请联系客服" : "已提交，等待管理员确认到账"}</div>}</div><Link href={payment.kind === "ORDER" && payment.orderId ? `/orders/${payment.orderId}` : "/profile"} className="inline-flex text-sm font-medium text-violet-600 hover:text-violet-700">返回{payment.kind === "ORDER" ? "订单" : "用户中心"}</Link></div>;
}
