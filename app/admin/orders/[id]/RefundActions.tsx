"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resolveRefund } from "../../actions";
export default function RefundActions({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function run(approved: boolean, reply?: string) {
    setError(null);
    startTransition(async () => {
      const result = await resolveRefund(orderId, approved, reply);
      if (result?.error) { setError(result.error); return; }
      setRejecting(false);
      router.refresh();
    });
  }

  return <>
    <div className="flex gap-2"><button disabled={pending} onClick={() => run(true)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">同意申请</button><button disabled={pending} onClick={() => setRejecting(true)} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">拒绝申请</button></div>
    {rejecting && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) setRejecting(false); }}><div role="dialog" aria-modal="true" aria-labelledby="reject-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h3 id="reject-title" className="text-lg font-semibold">填写拒绝理由</h3><p className="mt-1 text-sm text-slate-500">拒绝理由将在用户的订单详情中显示。</p><textarea autoFocus value={reason} onChange={(event) => { setReason(event.target.value); setError(null); }} maxLength={300} rows={5} placeholder="请输入拒绝理由…" className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100" />{error && <p className="mt-2 text-sm text-rose-600">{error}</p>}<div className="mt-4 flex justify-end gap-2"><button type="button" disabled={pending} onClick={() => setRejecting(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">取消</button><button type="button" disabled={pending || !reason.trim()} onClick={() => run(false, reason)} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50">{pending ? "提交中…" : "确认拒绝"}</button></div></div></div>}
  </>;
}
