"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import CartItemRow from "./CartItemRow";

type Item = {
  id: string;
  quantity: number;
  product: { name: string; slug: string; price: number; imageUrl: string; stock: number };
};

export default function CartContent({ items }: { items: Item[] }) {
  const [selected, setSelected] = useState<string[]>(() => items.map((item) => item.id));
  const router = useRouter();
  const selectedItems = useMemo(() => items.filter((item) => selected.includes(item.id)), [items, selected]);
  const total = selectedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const allSelected = items.length > 0 && selected.length === items.length;

  useEffect(() => {
    const availableIds = new Set(items.map((item) => item.id));
    setSelected((current) => current.filter((id) => availableIds.has(id)));
  }, [items]);

  function checkout() {
    if (selected.length === 0) return;
    router.push(`/checkout?items=${encodeURIComponent(selected.join(","))}`);
  }

  return <div className="grid gap-8 lg:grid-cols-3">
    <div className="lg:col-span-2">
      <div className="rounded-xl border border-slate-200 bg-white px-4">
        <label className="flex items-center gap-3 border-b border-slate-200 py-3 text-sm font-medium text-slate-600">
          <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? [] : items.map((item) => item.id))} className="h-4 w-4 accent-indigo-600" />
          全选 <span className="text-slate-400">已选 {selected.length} 件商品</span>
        </label>
        <div className="divide-y divide-slate-200">
          {items.map((item) => <CartItemRow key={item.id} item={item} selected={selected.includes(item.id)} onSelectedChange={(checked) => setSelected((current) => checked ? [...new Set([...current, item.id])] : current.filter((id) => id !== item.id))} />)}
        </div>
      </div>
    </div>
    <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold">订单摘要</h2>
      <div className="mt-4 flex justify-between text-sm text-slate-600"><span>已选 {selected.length} 件商品</span><span className="font-semibold text-orange-500">{formatPrice(total)}</span></div>
      <div className="mt-2 flex justify-between text-sm text-slate-600"><span>运费</span><span>免运费</span></div>
      <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-lg font-semibold"><span>合计</span><span className="font-bold text-orange-500">{formatPrice(total)}</span></div>
      <button type="button" onClick={checkout} disabled={selected.length === 0} className="mt-6 w-full rounded-lg bg-indigo-600 py-3 text-center font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300">去结算</button>
      {selected.length === 0 && <p className="mt-2 text-center text-xs text-rose-500">请先选择要结算的商品</p>}
    </aside>
  </div>;
}
