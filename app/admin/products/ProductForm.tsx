"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import type { ActionState } from "../actions";
import type { Department } from "@/lib/catalog";
import ProductImage from "@/app/components/ProductImage";
import { normalizeProductImageUrl } from "@/lib/product-images";

type Category = { id: string; name: string };

type ProductDefaults = {
  name?: string;
  description?: string;
  price?: number; // cents
  imageUrl?: string;
  stock?: number;
  categoryId?: string;
  departmentSlug?: string | null;
  subcategoryName?: string | null;
  isActive?: boolean;
};

export default function ProductForm({
  action,
  categories,
  defaults,
  submitLabel,
  catalogDepartments,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  categories: Category[];
  defaults?: ProductDefaults;
  submitLabel: string;
  catalogDepartments: Department[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const initialDepartment = catalogDepartments.find((item) => item.slug === defaults?.departmentSlug) ?? catalogDepartments[0];
  const [departmentSlug, setDepartmentSlug] = useState(initialDepartment.slug);
  const [subcategoryName, setSubcategoryName] = useState(
    initialDepartment.subcategories.some((item) => item.name === defaults?.subcategoryName)
      ? defaults?.subcategoryName ?? initialDepartment.subcategories[0].name
      : initialDepartment.subcategories[0].name
  );
  const activeDepartment = catalogDepartments.find((item) => item.slug === departmentSlug) ?? catalogDepartments[0];
  const [imageUrl, setImageUrl] = useState(defaults?.imageUrl ? normalizeProductImageUrl(defaults.imageUrl) : "");
  const [localPreview, setLocalPreview] = useState<string>();

  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <div>
        <label className="block text-sm font-medium">商品名称</label>
        <input
          name="name"
          type="text"
          required
          defaultValue={defaults?.name ?? ""}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">商品描述 <span className="font-normal text-slate-400">（选填）</span></label>
        <textarea
          name="description"
          rows={3}
          defaultValue={defaults?.description ?? ""}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">价格（元）</label>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={
              defaults?.price != null ? (defaults.price / 100).toFixed(2) : ""
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">库存</label>
          <input
            name="stock"
            type="number"
            min="0"
            required
            defaultValue={defaults?.stock ?? 0}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">商品图片</label>
        <label className="mt-2 flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-blue-300 bg-blue-50 px-4 py-4 text-sm font-medium text-blue-700 hover:bg-blue-100">
          从电脑选择图片
          <input
            name="imageFile"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setLocalPreview(file ? URL.createObjectURL(file) : undefined);
            }}
          />
        </label>
        <p className="mt-1 text-xs text-slate-500">支持 JPG、PNG、WebP、GIF，最大 5MB。选择文件后将优先使用上传图片。</p>
        <div className="my-3 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" /><span>或填写图片链接</span><span className="h-px flex-1 bg-slate-200" /></div>
        <input
          name="imageUrl"
          type="text"
          placeholder="/products/example.jpg 或 https://example.com/image.jpg"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
        />
        <p className="mt-1 text-xs text-slate-500">服务器 public 目录中的图片填写 /products/文件名；误填 /public/products/... 时保存后会自动修正。</p>
        {(localPreview || imageUrl.trim()) && (
          <div className="relative mt-3 aspect-video overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            {localPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={localPreview} alt="本地商品图片预览" className="absolute inset-0 h-full w-full object-contain" />
            ) : (
              <ProductImage src={imageUrl} alt="商品图片预览" sizes="576px" className="object-contain" />
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">首页大类</label>
          <select name="departmentSlug" required value={departmentSlug} onChange={(event) => { const slug = event.target.value; const next = catalogDepartments.find((item) => item.slug === slug) ?? catalogDepartments[0]; setDepartmentSlug(slug); setSubcategoryName(next.subcategories[0]?.name ?? ""); }} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900">
            {catalogDepartments.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">商品小类</label>
          <select name="subcategoryName" required value={subcategoryName} onChange={(event) => setSubcategoryName(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900">
            {activeDepartment.subcategories.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">后台分类</label>
        <select
          name="categoryId"
          required
          defaultValue={defaults?.categoryId ?? ""}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
        >
          <option value="" disabled>
            请选择分类
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div>
          <span className="block text-sm font-medium text-slate-900">上架状态</span>
          <span className="text-xs text-slate-500">关闭后商品将不在前台展示</span>
        </div>
        <input
          name="isActive"
          type="checkbox"
          defaultChecked={defaults?.isActive ?? true}
          className="h-5 w-5 accent-orange-500"
        />
      </label>

      {state?.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {pending ? "保存中..." : submitLabel}
        </button>
        <Link
          href="/admin/products"
          className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium hover:bg-slate-50"
        >
          取消
        </Link>
      </div>
    </form>
  );
}
