"use client";

import { useState, useTransition } from "react";
import { setUserRole } from "../actions";
import ConfirmDialog from "@/app/components/ConfirmDialog";

export default function UserRoleButton({ id, initialAdmin, userName }: { id: string; initialAdmin: boolean; userName: string }) {
  const [isAdmin, setIsAdmin] = useState(initialAdmin);
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  function submit() {
    if (!confirmOpen) { setConfirmOpen(true); return; }
    setError(null);
    startTransition(async () => {
      const result = await setUserRole(id, !isAdmin);
      if (result?.error) setError(result.error);
      else { setIsAdmin(!isAdmin); setConfirmOpen(false); }
    });
  }
  return <div><button disabled={pending} onClick={submit} className={isAdmin ? "rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700" : "rounded-lg bg-violet-50 px-3 py-2 text-xs font-medium text-violet-700"}>{pending ? "处理中" : isAdmin ? "取消管理员" : "设为管理员"}</button>{error && <p className="mt-1 text-xs text-rose-600">{error}</p>}<ConfirmDialog open={confirmOpen} title={isAdmin ? "取消管理员" : "设为管理员"} message={isAdmin ? `确认取消“${userName}”的管理员权限吗？` : `确认将“${userName}”设为管理员吗？\n该账号将拥有完整后台管理权限。`} pending={pending} confirmLabel="确认" onCancel={() => setConfirmOpen(false)} onConfirm={submit} /></div>;
}
