"use client";

import { useState, useTransition } from "react";
import { setProductActive } from "../actions";

export default function ProductStatusControl({
  id,
  initialActive,
}: {
  id: string;
  initialActive: boolean;
}) {
  const [active, setActive] = useState(initialActive);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !active;
    setError(null);
    startTransition(async () => {
      const result = await setProductActive(id, next);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setActive(next);
    });
  }

  return (
    <div className="relative flex flex-1 items-center justify-between">
      <span className={active ? "text-xs text-emerald-600" : "text-xs text-slate-400"}>
        {active ? "● 已上架" : "● 已下架"}
      </span>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-label={active ? "下架商品" : "上架商品"}
        className={active
          ? "rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
          : "rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"}
      >
        {pending ? "处理中..." : active ? "下架" : "上架"}
      </button>
      {error && <span className="absolute right-0 top-10 z-20 w-36 rounded-lg bg-rose-600 p-2 text-xs text-white shadow-lg">{error}</span>}
    </div>
  );
}
