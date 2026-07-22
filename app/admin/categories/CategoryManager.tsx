"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCategory, deleteCategory, updateCategory } from "../actions";
import ConfirmDialog from "@/app/components/ConfirmDialog";

type Category = { id: string; name: string; slug: string; catalogKind: string; parentSlug: string | null; source: string; _count: { products: number } };

export default function CategoryManager({
  categories,
  departments,
}: {
  categories: Category[];
  departments: { name: string; slug: string }[];
}) {
  const [state, formAction, pending] = useActionState(createCategory, undefined);
  const [deleting, startDelete] = useTransition();
  const [delError, setDelError] = useState<string | null>(null);
  const [catalogKind, setCatalogKind] = useState("SUBCATEGORY");
  const [editing, setEditing] = useState<Category | null>(null);
  const [editKind, setEditKind] = useState("SUBCATEGORY");
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const router = useRouter();

  function handleDelete(id: string) {
    setDelError(null);
    startDelete(async () => {
      const res = await deleteCategory(id);
      if (res?.error) setDelError(res.error);
      else { setPendingDeleteId(null); router.refresh(); }
    });
  }

  function openEdit(category: Category) {
    setEditing(category);
    setEditKind(category.catalogKind === "DEPARTMENT" ? "DEPARTMENT" : "SUBCATEGORY");
    setEditError(null);
  }

  function saveEdit(formData: FormData) {
    startSaving(async () => {
      const result = await updateCategory(formData);
      if (result?.error) { setEditError(result.error); return; }
      setEditing(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <form action={formAction} className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[160px_200px_minmax(220px,1fr)_auto]">
        <select name="catalogKind" value={catalogKind} onChange={(event) => setCatalogKind(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900">
          <option value="DEPARTMENT">首页一级大类</option>
          <option value="SUBCATEGORY">二级小类</option>
        </select>
        {catalogKind === "SUBCATEGORY" ? <select name="parentSlug" required className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"><option value="">选择所属一级大类</option>{departments.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select> : <input type="hidden" name="parentSlug" value="" />}
        <input
          name="name"
          type="text"
          required
          placeholder={catalogKind === "DEPARTMENT" ? "新一级大类名称" : "新二级小类名称"}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {pending ? "添加中..." : "添加"}
        </button>
      </form>

      {state?.error && (
        <p className="text-sm text-rose-600">{state.error}</p>
      )}
      {delError && <p className="text-sm text-rose-600">{delError}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">名称</th>
              <th className="px-4 py-3 font-medium">标识（slug）</th>
              <th className="px-4 py-3 font-medium">级别</th>
              <th className="px-4 py-3 font-medium">所属大类</th>
              <th className="px-4 py-3 font-medium">来源</th>
              <th className="px-4 py-3 font-medium">商品数</th>
              <th className="px-4 py-3 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-slate-500">{c.slug}</td>
                <td className="px-4 py-3">{c.catalogKind === "DEPARTMENT" ? "一级大类" : c.catalogKind === "SUBCATEGORY" ? "二级小类" : "原有分类"}</td>
                <td className="px-4 py-3 text-slate-500">{c.parentSlug ? departments.find((item) => item.slug === c.parentSlug)?.name ?? c.parentSlug : "—"}</td>
                <td className="px-4 py-3"><span className={c.source === "ADMIN" ? "rounded-full bg-violet-100 px-2 py-1 text-xs text-violet-700" : "rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600"}>{c.source === "ADMIN" ? "管理员" : "系统"}</span></td>
                <td className="px-4 py-3">{c._count.products}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(c)} disabled={deleting} className="mr-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">编辑</button>
                  <button
                    onClick={() => setPendingDeleteId(c.id)}
                    disabled={deleting}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  暂无分类。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setEditing(null); }}><form action={saveEdit} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl"><input type="hidden" name="id" value={editing.id} /><h3 className="text-lg font-semibold">编辑分类</h3><div><label className="block text-sm font-medium">分类名称</label><input name="name" required defaultValue={editing.name} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" /></div><div><label className="block text-sm font-medium">分类级别</label><select name="catalogKind" value={editKind} onChange={(event) => setEditKind(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"><option value="DEPARTMENT">首页一级大类</option><option value="SUBCATEGORY">二级小类</option></select></div>{editKind === "SUBCATEGORY" && <div><label className="block text-sm font-medium">所属一级大类</label><select name="parentSlug" required defaultValue={editing.parentSlug ?? departments[0]?.slug} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">{departments.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></div>}{editError && <p className="text-sm text-rose-600">{editError}</p>}<div className="flex justify-end gap-2"><button type="button" disabled={saving} onClick={() => setEditing(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">取消</button><button disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? "保存中..." : "保存修改"}</button></div></form></div>}
      <ConfirmDialog open={pendingDeleteId !== null} title="删除分类" message="确定删除该分类吗？\n关联商品将安全转移到其他分类。" pending={deleting} confirmLabel="确认删除" onCancel={() => setPendingDeleteId(null)} onConfirm={() => pendingDeleteId && handleDelete(pendingDeleteId)} />
    </div>
  );
}
