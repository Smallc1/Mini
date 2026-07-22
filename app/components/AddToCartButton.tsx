"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/app/cart/actions";
import { CART_UPDATED_EVENT } from "./CartCountBadge";

export default function AddToCartButton({
  productId,
  disabled,
  className,
  label = "加入购物车",
  pendingLabel = "加入中...",
  redirectTo,
}: {
  productId: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  pendingLabel?: string;
  redirectTo?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  function handleClick() {
    setMsg(null);
    startTransition(async () => {
      try {
        const res = await addToCart(productId, 1);
        if (res?.error) {
          setMsg(res.error);
        } else {
          window.dispatchEvent(
            new CustomEvent(CART_UPDATED_EVENT, { detail: res.cartCategoryCount })
          );
          if (redirectTo) {
            router.push(redirectTo);
            return;
          }
          setMsg("已加入购物车");
          router.refresh();
          setTimeout(() => setMsg(null), 2000);
        }
      } catch {
        setMsg("加入失败，请刷新页面后重试");
      }
    });
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || pending}
        className={
          className ??
          "rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        }
      >
        {disabled ? "已售罄" : pending ? pendingLabel : label}
      </button>
      {msg && <span className="text-xs text-emerald-600">{msg}</span>}
    </div>
  );
}
