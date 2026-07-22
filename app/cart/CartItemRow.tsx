"use client";

import ProductImage from "@/app/components/ProductImage";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { updateCartItem, removeCartItem } from "./actions";
import { CART_UPDATED_EVENT } from "@/app/components/CartCountBadge";

type Item = {
  id: string;
  quantity: number;
  product: {
    name: string;
    slug: string;
    price: number;
    imageUrl: string;
    stock: number;
  };
};

export default function CartItemRow({ item, selected, onSelectedChange }: { item: Item; selected: boolean; onSelectedChange: (checked: boolean) => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function change(quantity: number) {
    setError(null);
    startTransition(async () => {
      const result = await updateCartItem(item.id, quantity);
      if (result?.error) {
        setError(result.error);
        return;
      }
      window.dispatchEvent(
        new CustomEvent(CART_UPDATED_EVENT, { detail: result.cartCategoryCount })
      );
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await removeCartItem(item.id);
      if (result?.error) {
        setError(result.error);
        return;
      }
      window.dispatchEvent(
        new CustomEvent(CART_UPDATED_EVENT, { detail: result.cartCategoryCount })
      );
      router.refresh();
    });
  }

  return (
    <div className={`flex min-w-0 flex-wrap items-center gap-2 py-4 transition sm:flex-nowrap sm:gap-4 ${pending ? "opacity-70" : ""}`}>
      <input type="checkbox" checked={selected} onChange={(event) => onSelectedChange(event.target.checked)} aria-label={`选择 ${item.product.name}`} className="h-4 w-4 shrink-0 accent-indigo-600" />
      <Link
        href={`/products/${item.product.slug}`}
        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-20 sm:w-20"
      >
        <ProductImage
          src={item.product.imageUrl}
          alt={item.product.name}
          sizes="80px"
          className="object-cover"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={`/products/${item.product.slug}`}
          className="font-medium hover:text-indigo-600"
        >
          {item.product.name}
        </Link>
        <p className="text-sm text-slate-500">
          单价 {formatPrice(item.product.price)}
        </p>
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </div>

      <div className="ml-6 flex items-center overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm sm:ml-0">
        <button
          onClick={() => change(item.quantity - 1)}
          disabled={pending}
          className="h-9 w-9 text-lg leading-none transition hover:bg-amber-50 hover:text-orange-600 disabled:opacity-50"
          aria-label="减少数量"
        >
          −
        </button>
        <span className="w-9 border-x border-slate-200 text-center text-sm font-semibold leading-9">{item.quantity}</span>
        <button
          onClick={() => change(item.quantity + 1)}
          disabled={pending || item.quantity >= item.product.stock}
          className="h-9 w-9 text-lg leading-none transition hover:bg-amber-50 hover:text-orange-600 disabled:opacity-50"
          aria-label="增加数量"
        >
          +
        </button>
      </div>

      <div className="ml-auto text-right font-bold text-orange-500 sm:w-24">
        {formatPrice(item.product.price * item.quantity)}
      </div>

      <button
        onClick={remove}
        disabled={pending}
        className="text-sm text-slate-400 hover:text-rose-600 disabled:opacity-50"
      >
        删除
      </button>
    </div>
  );
}
