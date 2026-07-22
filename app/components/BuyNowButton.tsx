"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { buyNow } from "@/app/orders/actions";

export default function BuyNowButton({
  productId,
  stock,
  className,
}: {
  productId: string;
  stock: number;
  className?: string;
}) {
  const [selecting, setSelecting] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await buyNow(productId, quantity);
      if (result.needsLogin) {
        router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
        return;
      }
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/orders/${result.orderId}?created=1`);
    });
  }

  if (!selecting) {
    return (
      <div className="flex min-w-0 flex-1">
        <button
          type="button"
          onClick={() => setSelecting(true)}
          disabled={stock < 1}
          className={className}
        >
          {stock < 1 ? "已售罄" : "立即购买"}
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex h-10 items-center overflow-hidden rounded-xl border border-orange-300 bg-white">
        <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={pending || quantity <= 1} className="h-full w-8 text-lg hover:bg-orange-50 disabled:opacity-40">−</button>
        <input
          type="number"
          min="1"
          max={stock}
          value={quantity}
          onChange={(event) => setQuantity(Math.min(stock, Math.max(1, Number(event.target.value) || 1)))}
          disabled={pending}
          aria-label="购买数量"
          className="h-full min-w-0 flex-1 border-x border-orange-200 px-1 text-center text-sm font-semibold outline-none"
        />
        <button type="button" onClick={() => setQuantity((value) => Math.min(stock, value + 1))} disabled={pending || quantity >= stock} className="h-full w-8 text-lg hover:bg-orange-50 disabled:opacity-40">+</button>
        <button type="button" onClick={confirm} disabled={pending} className="h-full bg-orange-500 px-3 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-60">
          {pending ? "创建中" : "确认"}
        </button>
      </div>
      <button type="button" onClick={() => setSelecting(false)} disabled={pending} className="text-xs text-slate-400 hover:text-slate-700">取消</button>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </div>
  );
}
