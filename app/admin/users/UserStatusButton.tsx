"use client";

import { useState, useTransition } from "react";
import { toggleUserDisabled } from "../actions";
import ConfirmDialog from "@/app/components/ConfirmDialog";

export default function UserStatusButton({ id, initialDisabled, userName = "该用户" }: { id: string; initialDisabled: boolean; userName?: string }) {
  const [disabled, setDisabled] = useState(initialDisabled);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  function toggle() {
    if (!disabled && !confirmOpen) { setConfirmOpen(true); return; }
    setError(null);
    startTransition(async () => {
      const result = await toggleUserDisabled(id, !disabled);
      if (result?.error) setError(result.error);
      else { setDisabled(!disabled); setConfirmOpen(false); }
    });
  }
  return <div><button disabled={pending} onClick={toggle} className={disabled ? "rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700" : "rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"}>{pending ? "处理中" : disabled ? "恢复账号" : "移除"}</button>{error && <p className="mt-1 text-xs text-rose-600">{error}</p>}<ConfirmDialog open={confirmOpen} title="移除用户" message={`确认移除用户“${userName}”吗？\n移除后该用户将无法登录。`} pending={pending} confirmLabel="确认移除" onCancel={() => setConfirmOpen(false)} onConfirm={toggle} /></div>;
}
