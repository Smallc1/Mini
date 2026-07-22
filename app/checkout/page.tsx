import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCartItems } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";
import { applyMemberDiscount, getMembership } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import CheckoutForm from "./CheckoutForm";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ items?: string }>;

export default async function CheckoutPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/checkout");

  const params = await searchParams;
  const selectedIds = params.items?.split(",").filter(Boolean) ?? [];
  const allItems = await getCartItems(session.user.id);
  const items = selectedIds.length > 0 ? allItems.filter((item) => selectedIds.includes(item.id)) : allItems;
  if (items.length === 0) redirect("/cart");

  const subtotal = items.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0
  );
  const [addresses, spent] = await Promise.all([
    prisma.address.findMany({ where: { userId: session.user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] }),
    prisma.order.aggregate({ where: { userId: session.user.id, status: { in: ["PAID", "SHIPPED", "COMPLETED"] }, OR: [{ refundStatus: null }, { refundStatus: { in: ["PENDING", "REJECTED"] } }] }, _sum: { total: true } }),
  ]);
  const membership = getMembership(spent._sum.total ?? 0);
  const total = applyMemberDiscount(subtotal, membership.discount);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">结算</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">收货信息</h2>
          <CheckoutForm defaultName={session.user.name ?? undefined} addresses={addresses} selectedIds={items.map((item) => item.id)} />
        </div>

        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">订单摘要</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between">
                <span className="text-slate-600">
                  {i.product.name} × {i.quantity}
                </span>
                <span>{formatPrice(i.product.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          {membership.discount < 1 && (
            <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-sm">
              <span className="text-violet-600">{membership.label} {membership.discount * 10} 折</span>
              <span className="text-slate-400"><del>{formatPrice(subtotal)}</del></span>
            </div>
          )}
          <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-lg font-semibold">
            <span>合计</span>
            <span>{formatPrice(total)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
