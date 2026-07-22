"use client";

import ProductImage from "@/app/components/ProductImage";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { batchUpdateProducts } from "../actions";
import DeleteProductButton from "./DeleteProductButton";
import StockControl from "./StockControl";
import ConfirmDialog from "@/app/components/ConfirmDialog";

type ProductRow = {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  stock: number;
  isActive: boolean;
  createdAt: string;
  sales: number;
  category: { name: string };
};

export default function AdminProductTable({ products }: { products: ProductRow[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [batchOperation, setBatchOperation] = useState<"deactivate" | "delete" | null>(null);
  const router = useRouter();
  const allSelected = products.length > 0 && products.every((item) => selected.includes(item.id));

  function toggleAll() {
    setSelected(allSelected ? [] : products.map((item) => item.id));
  }

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function runBatch(operation: "deactivate" | "delete") {
    if (selected.length === 0) {
      setError("请先选择商品");
      return;
    }
    setBatchOperation(operation);
  }

  function confirmBatch() {
    if (!batchOperation) return;
    setError(null);
    startTransition(async () => {
      const result = await batchUpdateProducts(selected, batchOperation);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSelected([]);
      setBatchOperation(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <ConfirmDialog open={batchOperation !== null} title={batchOperation === "delete" ? "批量删除商品" : "批量下架商品"} message={batchOperation === "delete" ? `确定永久删除选中的 ${selected.length} 件商品吗？\n此操作无法撤销。` : `确定下架选中的 ${selected.length} 件商品吗？`} pending={pending} onCancel={() => setBatchOperation(null)} onConfirm={confirmBatch} />
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <span className="mr-2 text-sm text-slate-500">已选 {selected.length} 件</span>
        <button
          type="button"
          onClick={() => runBatch("deactivate")}
          disabled={pending}
          className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-200 disabled:opacity-50"
        >
          批量下架
        </button>
        <button
          type="button"
          onClick={() => runBatch("delete")}
          disabled={pending}
          className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
        >
          批量删除
        </button>
        {pending && <span className="text-sm text-slate-400">处理中...</span>}
        {error && <span className="text-sm text-rose-600">{error}</span>}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="w-12 px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="全选当前页" className="h-4 w-4 accent-orange-500" />
              </th>
              <th className="px-4 py-3 font-medium">商品</th>
              <th className="px-4 py-3 font-medium">分类</th>
              <th className="px-4 py-3 font-medium">价格</th>
              <th className="px-4 py-3 font-medium">库存</th>
              <th className="px-4 py-3 font-medium">销量</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">创建时间</th>
              <th className="px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => (
              <tr key={product.id} className="transition hover:bg-slate-50/80">
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.includes(product.id)} onChange={() => toggle(product.id)} aria-label={`选择${product.name}`} className="h-4 w-4 accent-orange-500" />
                </td>
                <td className="max-w-sm px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      <ProductImage src={product.imageUrl} alt={product.name} sizes="48px" className="object-cover" />
                    </div>
                    <span className="line-clamp-2 font-medium text-slate-900">{product.name}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{product.category.name}</td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-orange-500">{formatPrice(product.price)}</td>
                <td className="px-4 py-3"><StockControl id={product.id} initialStock={product.stock} /></td>
                <td className="px-4 py-3 font-medium text-slate-700">{product.sales}</td>
                <td className="px-4 py-3">
                  <span className={product.isActive ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700" : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"}>
                    {product.isActive ? "上架" : "下架"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                  {new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(new Date(product.createdAt))}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <Link href={`/admin/products/${product.id}/edit`} className="text-blue-600 hover:underline">编辑</Link>
                    <DeleteProductButton id={product.id} />
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400">没有找到符合条件的商品。</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
