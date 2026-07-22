import { prisma } from "@/lib/prisma";
import { createProduct } from "../../actions";
import ProductForm from "../ProductForm";
import { getCatalogDepartments } from "@/lib/catalog-db";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, catalogDepartments] = await Promise.all([
    prisma.category.findMany({ where: { catalogKind: { not: "DEPARTMENT" } }, orderBy: { name: "asc" } }),
    getCatalogDepartments(),
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">新增商品</h2>
      {categories.length === 0 ? (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          请先创建分类，然后再添加商品。
        </p>
      ) : (
        <ProductForm
          action={createProduct}
          categories={categories}
          catalogDepartments={catalogDepartments}
          submitLabel="创建商品"
        />
      )}
    </div>
  );
}
