import { prisma } from "@/lib/prisma";
import CategoryManager from "./CategoryManager";
import { getCatalogDepartments } from "@/lib/catalog-db";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const [categories, departments] = await Promise.all([
    prisma.category.findMany({ orderBy: [{ catalogKind: "asc" }, { name: "asc" }], include: { _count: { select: { products: true } } } }),
    getCatalogDepartments(),
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">分类管理</h2>
      <CategoryManager categories={categories} departments={departments.map((item) => ({ name: item.name, slug: item.slug }))} />
    </div>
  );
}
