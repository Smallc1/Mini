"use client";

import { useEffect, useState } from "react";

export const CART_UPDATED_EVENT = "mini-mall:cart-updated";

export default function CartCountBadge({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    function update(event: Event) {
      const nextCount = (event as CustomEvent<number>).detail;
      if (Number.isInteger(nextCount) && nextCount >= 0) setCount(nextCount);
    }

    window.addEventListener(CART_UPDATED_EVENT, update);
    return () => window.removeEventListener(CART_UPDATED_EVENT, update);
  }, []);

  if (count === 0) return null;

  return (
    <span className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-semibold text-white">
      {count}
    </span>
  );
}
