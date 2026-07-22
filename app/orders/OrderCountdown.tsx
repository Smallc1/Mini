"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelExpiredOrder } from "./actions";

export default function OrderCountdown({ orderId, expiresAt }: { orderId: string; expiresAt: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [cancelling, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const update = () => setRemaining(Math.max(0, new Date(expiresAt).getTime() - Date.now()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  useEffect(() => {
    if (remaining !== 0 || cancelling) return;
    startTransition(async () => {
      await cancelExpiredOrder(orderId);
      router.refresh();
    });
  }, [cancelling, orderId, remaining, router]);

  if (remaining === null) return <span className="text-xs font-medium text-amber-700">剩余 --:--</span>;
  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return <span className="text-xs font-medium text-amber-700">剩余 {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</span>;
}
