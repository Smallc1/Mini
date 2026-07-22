import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCartItems } from "@/lib/cart";
import CartContent from "./CartContent";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/cart");

  const items = await getCartItems(session.user.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">我的购物车</h1>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <p className="text-slate-500">购物车还是空的。</p>
          <Link
            href="/products"
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
          >
            去逛逛
          </Link>
        </div>
      ) : (
        <CartContent items={items} />
      )}
    </div>
  );
}
