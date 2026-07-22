import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import OrderStatusBadge from "@/app/components/OrderStatusBadge";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [productCount, categoryCount, orderCount, revenue, recentOrders] =
    await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        where: { status: { in: ["PAID", "SHIPPED"] } },
        _sum: { total: true },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { items: true },
      }),
    ]);

  const stats = [
    { label: "商品数", value: productCount, href: "/admin/products" },
    { label: "分类数", value: categoryCount, href: "/admin/categories" },
    { label: "订单数", value: orderCount, href: "/admin/orders" },
    {
      label: "销售额",
      value: formatPrice(revenue._sum.total ?? 0),
      href: "/admin/orders",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-900"
          >
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">最近订单</h2>
          <Link href="/admin/orders" className="text-sm text-indigo-600 hover:underline">
            查看全部 →
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-slate-400">暂无订单。</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentOrders.map((o) => (
              <Link
                key={o.id}
                href={`/admin/orders/${o.id}`}
                className="flex items-center justify-between py-3 text-sm hover:text-indigo-600"
              >
                <span>#{o.id.slice(-8)}</span>
                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={o.status} />
                  <span className="w-20 text-right font-medium">
                    {formatPrice(o.total)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
