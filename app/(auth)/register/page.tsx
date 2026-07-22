"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "../actions";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, undefined);

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold">注册账号</h1>
      <p className="mt-1 text-sm text-slate-500">加入迷你商城，开始购物吧。</p>

      <form action={action} className="mt-8 space-y-4">
        <div>
          <label className="block text-sm font-medium">昵称</label>
          <input
            name="name"
            type="text"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">QQ 邮箱</label>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
          />
          <p className="mt-1 text-xs text-slate-400">请使用 QQ 邮箱注册</p>
        </div>
        <div>
          <label className="block text-sm font-medium">密码</label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
          />
          <p className="mt-1 text-xs text-slate-400">至少 6 个字符。</p>
        </div>
        <div>
          <label className="block text-sm font-medium">手机号码</label>
          <input name="phone" type="tel" inputMode="numeric" required pattern="1[0-9]{10}" placeholder="用于手机号登录" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900" />
        </div>

        {state?.error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "注册中..." : "注册"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        已有账号？{" "}
        <Link href="/login" className="font-medium text-slate-900 underline">
          立即登录
        </Link>
      </p>
    </div>
  );
}
