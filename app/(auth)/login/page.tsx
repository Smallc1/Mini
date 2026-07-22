"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction } from "../actions";

function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const callbackUrl = useSearchParams().get("callbackUrl") ?? "/";
  const concurrentLogin = useSearchParams().get("reason") === "concurrent";

  return (
    <form action={action} autoComplete="off" className="mt-8 space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      {concurrentLogin && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          警告：当前账号已在其他设备登录，本设备会话已失效。
        </p>
      )}
      <div>
        <label className="block text-sm font-medium">邮箱或手机号码</label>
        <input
          name="identifier"
          type="text"
          required
          autoComplete="off"
          placeholder="请输入邮箱或手机号码"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">密码</label>
        <input
          name="password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="请输入密码"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
      >
        {pending ? "登录中..." : "登录"}
      </button>
      <div className="text-right"><Link href="/forgot-password" className="text-sm font-medium text-violet-600 hover:text-violet-700">忘记密码？</Link></div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-slate-950">欢迎回到迷你商城</h1>

      <Suspense fallback={<div className="mt-8 h-64" />}>
        <LoginForm />
      </Suspense>

      <p className="mt-6 text-center text-sm text-slate-500">
        还没有账号？{" "}
        <Link href="/register" className="font-medium text-slate-900 underline">
          立即注册
        </Link>
      </p>
    </div>
  );
}
