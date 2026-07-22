"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "../../actions";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/utils";

export default function StatusSelect({
  orderId,
  current,
}: {
  orderId: string;
  current: string;
}) {
  const [value, setValue] = useState(current);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  function handleChange(next: string) {
    setValue(next);
    setMsg(null);
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, next);
      if (res?.error) {
        setMsg(res.error);
        setValue(current);
      } else {
        setMsg("已更新");
        router.refresh();
        setTimeout(() => setMsg(null), 1500);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        disabled={pending}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 disabled:opacity-60"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {ORDER_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {msg && <span className="text-xs text-emerald-600">{msg}</span>}
    </div>
  );
}
