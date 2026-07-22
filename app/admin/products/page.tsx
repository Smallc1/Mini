import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import CategoryProductBoard from "./CategoryProductBoard";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  category?: string;
  status?: string;
  sort?: string;
}>;

export default async function AdminProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const where: Prisma.ProductWhereInput = {};

  if (params.q) {
    where.OR = [
      { name: { contains: params.q } },
      { description: { contains: params.q } },
    ];
  }
  if (params.category) where.categoryId = params.category;
  if (params.status === "active") where.isActive = true;
  if (params.status === "inactive") where.isActive = false;

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    params.sort === "price-asc" ? { price: "asc" }
      : params.sort === "price-desc" ? { price: "desc" }
        : params.sort === "created-asc" ? { createdAt: "asc" }
          : { createdAt: "desc" };

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  const salesRows = products.length > 0
    ? await prisma.orderItem.groupBy({
        by: ["productId"],
        where: { productId: { in: products.map((product) => product.id) } },
        _sum: { quantity: true },
      })
    : [];
  const salesByProduct = new Map(
    salesRows.map((row) => [row.productId, row._sum.quantity ?? 0])
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">商品管理</h2>
          <p className="text-sm text-slate-500">共 {total} 件商品</p>
        </div>
        <Link href="/admin/products/new" className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600">
          + 新增商品
        </Link>
      </div>

      <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[minmax(220px,1fr)_180px_130px_160px_auto]">
        <input name="q" defaultValue={params.q ?? ""} placeholder="搜索商品名称或描述" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100" />
        <select name="category" defaultValue={params.category ?? ""} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500">
          <option value="">全部分类</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <select name="status" defaultValue={params.status ?? ""} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500">
          <option value="">全部状态</option>
          <option value="active">上架</option>
          <option value="inactive">下架</option>
        </select>
        <select name="sort" defaultValue={params.sort ?? "created-desc"} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500">
          <option value="created-desc">最新创建</option>
          <option value="created-asc">最早创建</option>
          <option value="price-asc">价格从低到高</option>
          <option value="price-desc">价格从高到低</option>
        </select>
        <div className="flex gap-2">
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">筛选</button>
          <Link href="/admin/products" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">重置</Link>
        </div>
      </form>

      <CategoryProductBoard categories={categories
        .map((category) => ({
          id: category.id,
          name: category.name,
          products: products
            .filter((product) => product.categoryId === category.id)
            .map((product) => ({
              id: product.id,
              name: product.name,
              imageUrl: product.imageUrl,
              price: product.price,
              stock: product.stock,
              isActive: product.isActive,
              sales: salesByProduct.get(product.id) ?? 0,
            })),
        }))
        .filter((category) => category.products.length > 0)} />
    </div>
  );
}
