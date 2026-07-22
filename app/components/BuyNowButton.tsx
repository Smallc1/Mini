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
  const [quantityInput, setQuantityInput] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const quantity = Math.min(stock, Math.max(1, Number.parseInt(quantityInput, 10) || 1));

  function adjustQuantity(amount: number) {
    setQuantityInput(String(Math.min(stock, Math.max(1, quantity + amount))));
  }

  function updateQuantity(value: string) {
    if (value === "") {
      setQuantityInput("");
      return;
    }
    if (!/^\d+$/.test(value)) return;
    const next = Number.parseInt(value, 10);
    setQuantityInput(String(Math.min(stock, Math.max(1, next))));
  }

  function normalizeQuantity() {
    setQuantityInput(String(quantity));
  }

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
      <div
        className="grid h-10 min-w-0 items-center overflow-hidden rounded-xl border border-orange-300 bg-white"
        style={{ gridTemplateColumns: "28px minmax(32px, 1fr) 28px 56px" }}
      >
        <button type="button" title="减少 1 件" aria-label="减少 1 件" onClick={() => adjustQuantity(-1)} disabled={pending || quantity <= 1} className="h-full text-sm hover:bg-orange-50 disabled:opacity-40">−</button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={quantityInput}
          onChange={(event) => updateQuantity(event.target.value)}
          onBlur={normalizeQuantity}
          disabled={pending}
          aria-label="购买数量"
          className="h-full min-w-0 border-x border-orange-200 px-0 text-center text-sm font-bold tabular-nums text-slate-900 outline-none"
        />
        <button type="button" title="增加 1 件" aria-label="增加 1 件" onClick={() => adjustQuantity(1)} disabled={pending || quantity >= stock} className="h-full text-sm hover:bg-orange-50 disabled:opacity-40">+</button>
        <button type="button" onClick={confirm} disabled={pending} className="h-full w-full whitespace-nowrap bg-orange-500 p-0 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-60">{pending ? "创建中" : "确认"}</button>
      </div>
      <button type="button" onClick={() => setSelecting(false)} disabled={pending} className="py-0.5 text-xs text-slate-400 hover:text-slate-700">取消</button>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </div>
  );
}
