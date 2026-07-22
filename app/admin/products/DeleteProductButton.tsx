"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProduct } from "../actions";
import ConfirmDialog from "@/app/components/ConfirmDialog";

export default function DeleteProductButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const router = useRouter();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteProduct(id);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
      setConfirmOpen(false);
    });
  }

  return <span className="relative">
    <button onClick={() => setConfirmOpen(true)} disabled={pending} className="text-sm text-rose-600 hover:underline disabled:opacity-50">
      {pending ? "删除中..." : "删除"}
    </button>
    {error && <span className="absolute right-0 top-6 z-10 w-56 rounded-lg bg-rose-600 p-2 text-left text-xs text-white shadow-lg">{error}</span>}
    <ConfirmDialog open={confirmOpen} title="删除商品" message="确定删除该商品吗？\n此操作无法撤销。" pending={pending} confirmLabel="确认删除" onCancel={() => setConfirmOpen(false)} onConfirm={handleDelete} />
  </span>;
}
