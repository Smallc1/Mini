"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { signOut } from "next-auth/react";

const POLL_INTERVAL = 3000;

export default function RealtimeRefresh() {
  const router = useRouter();
  const previousSignal = useRef<string | null>(null);
  const checking = useRef(false);

  useEffect(() => {
    let stopped = false;

    async function check() {
      if (checking.current || document.visibilityState === "hidden") return;
      checking.current = true;
      try {
        const response = await fetch("/api/realtime", { cache: "no-store" });
        if (!response.ok || stopped) return;
        const data = await response.json();
        if (data.forcedLogout) {
          stopped = true;
          window.alert("警告：当前账号已在其他设备登录，本设备已自动退出。");
          await signOut({ redirect: false });
          window.location.replace("/login?reason=concurrent");
          return;
        }
        const signal = JSON.stringify(data);
        if (previousSignal.current !== null && previousSignal.current !== signal) {
          router.refresh();
        }
        previousSignal.current = signal;
      } catch {
        // A temporary network failure should not interrupt the current page.
      } finally {
        checking.current = false;
      }
    }

    void check();
    const timer = window.setInterval(check, POLL_INTERVAL);
    const syncWhenVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", syncWhenVisible);
    window.addEventListener("focus", check);

    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", syncWhenVisible);
      window.removeEventListener("focus", check);
    };
  }, [router]);

  return null;
}
