"use client";

import { useActionState, useState } from "react";
import { placeOrder } from "./actions";

type Address = { id: string; fullName: string; phone: string; address: string; isDefault: boolean };

export default function CheckoutForm({ defaultName, addresses, selectedIds }: { defaultName?: string; addresses: Address[]; selectedIds: string[] }) {
  const [state, action, pending] = useActionState(placeOrder, undefined);
  const defaultAddress = addresses.find((item) => item.isDefault) ?? addresses[0];
  const [addressId, setAddressId] = useState(defaultAddress?.id ?? "new");
  const useSavedAddress = addressId !== "new";

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="selectedIds" value={selectedIds.join(",")} />
      {addresses.length > 0 && (
        <div>
          <label className="block text-sm font-medium">选择收货地址</label>
          <select name="addressId" value={addressId} onChange={(event) => setAddressId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900">
            {addresses.map((item) => <option key={item.id} value={item.id}>{item.isDefault ? "[默认] " : ""}{item.fullName} · {item.phone} · {item.address}</option>)}
            <option value="new">使用新收货地址</option>
          </select>
        </div>
      )}
      {!useSavedAddress && <><div>
        <label className="block text-sm font-medium">收货人姓名</label>
        <input
          name="fullName"
          type="text"
          required
          defaultValue={defaultName ?? ""}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">收货地址</label>
        <textarea
          name="address"
          required
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">联系电话</label>
        <input
          name="phone"
          type="tel"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
        />
      </div>
      </>}

      {state?.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {pending ? "正在创建订单..." : "提交订单"}
      </button>
      <p className="text-center text-xs text-slate-400">
        提交后将创建待付款订单，请在 30 分钟内完成付款。
      </p>
    </form>
  );
}
