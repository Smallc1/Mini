import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateProduct } from "../../../actions";
import ProductForm from "../../ProductForm";
import { getCatalogDepartments } from "@/lib/catalog-db";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function EditProductPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  const [product, categories, catalogDepartments] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ where: { catalogKind: { not: "DEPARTMENT" } }, orderBy: { name: "asc" } }),
    getCatalogDepartments(),
  ]);

  if (!product) notFound();

  // Bind the product id to the update action.
  const action = updateProduct.bind(null, id);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">编辑商品</h2>
      <ProductForm
        action={action}
        categories={categories}
        catalogDepartments={catalogDepartments}
        submitLabel="保存修改"
        defaults={{
          name: product.name,
          description: product.description,
          price: product.price,
          imageUrl: product.imageUrl,
          stock: product.stock,
          categoryId: product.categoryId,
          departmentSlug: product.departmentSlug,
          subcategoryName: product.subcategoryName,
          isActive: product.isActive,
        }}
      />
    </div>
  );
}
