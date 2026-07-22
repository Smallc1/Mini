import { createAddress, deleteAddress, setDefaultAddress } from "./actions";

type Address = { id: string; fullName: string; phone: string; address: string; isDefault: boolean };

export default function AddressManager({ addresses }: { addresses: Address[] }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">收货地址</h2><span className="text-sm text-slate-400">{addresses.length} 个地址</span></div>
      <div className="grid gap-3 md:grid-cols-2">
        {addresses.map((item) => (
          <article key={item.id} className={`rounded-xl border bg-white p-4 ${item.isDefault ? "border-violet-400 ring-2 ring-violet-100" : "border-slate-200"}`}>
            <div className="flex items-center gap-2"><strong>{item.fullName}</strong><span className="text-sm text-slate-500">{item.phone}</span>{item.isDefault && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700">默认</span>}</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.address}</p>
            <div className="mt-3 flex gap-3 text-xs">
              {!item.isDefault && <form action={setDefaultAddress}><input type="hidden" name="addressId" value={item.id} /><button className="text-violet-600 hover:underline">设为默认</button></form>}
              <form action={deleteAddress}><input type="hidden" name="addressId" value={item.id} /><button className="text-rose-600 hover:underline">删除</button></form>
            </div>
          </article>
        ))}
      </div>
      <form action={createAddress} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
        <h3 className="font-semibold md:col-span-2">+ 添加新地址</h3>
        <input name="fullName" required placeholder="收货人姓名" className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-violet-500" />
        <input name="phone" required placeholder="联系电话" className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-violet-500" />
        <textarea name="address" required rows={2} placeholder="详细收货地址" className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-violet-500 md:col-span-2" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isDefault" />设为默认地址</label>
        <button className="rounded-lg bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-700 md:justify-self-end">保存地址</button>
      </form>
    </section>
  );
}
