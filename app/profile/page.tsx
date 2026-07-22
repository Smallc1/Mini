import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, getMembership } from "@/lib/utils";
import AddressManager from "./AddressManager";
import { logoutAction } from "@/app/(auth)/actions";
import { rechargeBalance } from "./actions";
import { isAdminRole } from "@/lib/roles";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/profile");
  const [spent, addresses, account] = await Promise.all([
    prisma.order.aggregate({ where: { userId: session.user.id, status: { in: ["PAID", "SHIPPED", "COMPLETED"] }, OR: [{ refundStatus: null }, { refundStatus: { in: ["PENDING", "REJECTED"] } }] }, _sum: { total: true } }),
    prisma.address.findMany({ where: { userId: session.user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { balance: true } }),
  ]);
  const totalSpent = spent._sum.total ?? 0;
  const calculatedMembership = getMembership(totalSpent);
  const membership = isAdminRole(session.user.role) ? { ...calculatedMembership, label: session.user.role === "OWNER" ? "站长" : "SSSVIP 用户" } : calculatedMembership;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">用户中心</h1>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <dl className="space-y-4 text-sm">
          <div><dt className="text-slate-400">用户名</dt><dd className="mt-1 font-medium">{session.user.name || "未设置"}</dd></div>
          <div><dt className="text-slate-400">登录邮箱</dt><dd className="mt-1 font-medium">{session.user.email}</dd></div>
          <div><dt className="text-slate-400">会员等级</dt><dd className="mt-1 font-semibold text-violet-600">{membership.label}{membership.discount < 1 ? ` · ${membership.discount * 10} 折` : ""}</dd></div>
          <div><dt className="text-slate-400">累计消费</dt><dd className="mt-1 text-xl font-bold text-orange-500">{formatPrice(totalSpent)}</dd></div>
          <div><dt className="text-slate-400">账户余额</dt><dd className="mt-1 text-2xl font-bold text-emerald-600">{formatPrice(account?.balance ?? 0)}</dd></div>
        </dl>
        <form action={rechargeBalance} className="mt-5 flex max-w-md flex-wrap gap-2">
          <label className="relative min-w-0 flex-1"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">¥</span><input name="amount" type="number" min="0.01" max="100000" step="0.01" required placeholder="输入充值金额" className="w-full rounded-xl border border-slate-300 py-2.5 pl-7 pr-3 outline-none focus:border-emerald-500" /></label>
          <select name="provider" required className="rounded-xl border border-slate-300 bg-white px-3 py-2.5"><option value="WECHAT">微信支付</option><option value="ALIPAY">支付宝</option></select>
          <button className="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700">去付款</button>
        </form>
        <Link href="/orders" className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700">
          查看我的订单
        </Link>
      </div>
      <AddressManager addresses={addresses} />
      <form action={logoutAction} className="flex justify-center pt-4">
        <button type="submit" className="rounded-xl border border-slate-300 bg-slate-100 px-6 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200">
          退出登录
        </button>
      </form>
    </div>
  );
}
