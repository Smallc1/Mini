"use client";

import { useState, useTransition } from "react";
import { adjustProductStock, setProductStock } from "../actions";

export default function StockControl({ id, initialStock }: { id: string; initialStock: number }) {
  const [stock, setStock] = useState(initialStock);
  const [inputValue, setInputValue] = useState(String(initialStock));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function adjust(change: -10 | 10) {
    setError(null);
    startTransition(async () => {
      const result = await adjustProductStock(id, change);
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (typeof result.stock === "number") {
        setStock(result.stock);
        setInputValue(String(result.stock));
      }
    });
  }

  function saveInput() {
    const trimmed = inputValue.trim();
    const nextStock = Number(trimmed);

    if (trimmed === "" || !Number.isInteger(nextStock) || nextStock < 0) {
      setError("请输入大于或等于 0 的整数");
      setInputValue(String(stock));
      return;
    }
    if (nextStock === stock) {
      setInputValue(String(stock));
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await setProductStock(id, nextStock);
      if (result?.error) {
        setError(result.error);
        setInputValue(String(stock));
        return;
      }
      setStock(nextStock);
      setInputValue(String(nextStock));
    });
  }

  return (
    <div className="relative inline-flex items-center overflow-visible rounded-lg border border-slate-300 bg-white shadow-sm">
      <button type="button" onClick={() => adjust(-10)} disabled={pending || stock === 0} aria-label="减少十件库存" title="库存 -10" className="h-8 w-8 rounded-l-lg text-lg transition hover:bg-orange-50 hover:text-orange-600 disabled:opacity-40">−</button>
      <input
        type="number"
        min="0"
        step="1"
        inputMode="numeric"
        value={inputValue}
        onChange={(event) => {
          setError(null);
          setInputValue(event.target.value);
        }}
        onBlur={saveInput}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            setInputValue(String(stock));
            event.currentTarget.blur();
          }
        }}
        disabled={pending}
        aria-label="库存数量"
        className="h-8 w-14 appearance-none border-x border-slate-200 bg-white px-1 text-center text-sm font-semibold outline-none focus:bg-orange-50 focus:ring-2 focus:ring-inset focus:ring-orange-400 disabled:opacity-60"
      />
      <button type="button" onClick={() => adjust(10)} disabled={pending} aria-label="增加十件库存" title="库存 +10" className="h-8 w-8 rounded-r-lg text-lg transition hover:bg-orange-50 hover:text-orange-600 disabled:opacity-40">+</button>
      {error && <span className="absolute left-0 top-10 z-20 w-40 rounded-lg bg-rose-600 p-2 text-xs text-white shadow-lg">{error}</span>}
    </div>
  );
}
