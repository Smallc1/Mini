import { prisma } from "@/lib/prisma";
import { departments, type Department } from "@/lib/catalog";

export async function getCatalogDepartments(): Promise<Department[]> {
  const customRows = await prisma.category.findMany({
    where: { catalogKind: { in: ["DEPARTMENT", "SUBCATEGORY"] } },
    orderBy: { name: "asc" },
  });
  const customDepartments: Department[] = customRows
    .filter((row) => row.catalogKind === "DEPARTMENT")
    .map((row) => ({
      name: row.name,
      slug: row.slug,
      icon: row.name.trim().toLowerCase() === "transportation" ? "✈️" : "🛒",
      tint: "bg-violet-100 text-violet-700",
      description: `${row.name}精选商品`,
      subcategories: [],
    }));

  return [...departments, ...customDepartments].map((department) => ({
    ...department,
    subcategories: [
      ...department.subcategories.filter((_, index) =>
        !customRows.some((row) => row.slug === `catalog-${department.slug}-${index + 1}`)
      ),
      ...customRows
        .filter((row) => row.catalogKind === "SUBCATEGORY" && row.parentSlug === department.slug)
        .filter((row) => !department.subcategories.some((item) => item.name === row.name))
        .map((row) => ({ name: row.name, keywords: [row.name], categorySlugs: [row.slug] })),
    ],
  }));
}

export async function getCatalogDepartment(slug?: string) {
  if (!slug) return undefined;
  return (await getCatalogDepartments()).find((department) => department.slug === slug);
}
