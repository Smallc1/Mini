import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { type Department, type Subcategory } from "@/lib/catalog";
import { getCatalogDepartment } from "@/lib/catalog-db";
import ProductCard from "@/app/components/ProductCard";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  category?: string;
  department?: string;
  subcategory?: string;
}>;
type ProductWithCategory = Prisma.ProductGetPayload<{ include: { category: true } }>;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q, category, department: departmentSlug, subcategory } = await searchParams;
  const department = await getCatalogDepartment(departmentSlug);

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const filters: Prisma.ProductWhereInput[] = [{ isActive: true }];
  if (q) {
    filters.push({
      OR: [{ name: { contains: q } }, { description: { contains: q } }],
    });
  }
  if (category) filters.push({ category: { slug: category } });
  if (department) {
    const catalogSlugs = department.subcategories.map(
      (_, index) => `catalog-${department.slug}-${index + 1}`
    );
    const legacySlugs = department.subcategories.flatMap(
      (subcategory) => subcategory.categorySlugs ?? []
    );
    filters.push({ OR: [
      { departmentSlug: department.slug },
      {
        departmentSlug: null,
        category: { slug: { in: [...catalogSlugs, ...legacySlugs] } },
      },
    ] });
  }
  const where: Prisma.ProductWhereInput = filters.length ? { AND: filters } : {};

  const products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  const activeCategory = categories.find((item) => item.slug === category);

  if (department) {
    return (
      <DepartmentProducts
        department={department}
        products={products}
        q={q}
        selectedSubcategory={subcategory}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title={activeCategory ? activeCategory.name : "全部商品"}
        count={products.length}
      />
      <SearchForm q={q} category={category} />

      <div className="flex flex-wrap gap-2">
        <FilterChip label="全部" href={buildHref(q)} active={!category} />
        {categories.map((item) => (
          <FilterChip
            key={item.id}
            label={item.name}
            href={buildHref(q, item.slug)}
            active={category === item.slug}
          />
        ))}
      </div>

      <ProductGrid products={products} />
    </div>
  );
}

function DepartmentProducts({
  department,
  products,
  q,
  selectedSubcategory,
}: {
  department: Department;
  products: ProductWithCategory[];
  q?: string;
  selectedSubcategory?: string;
}) {
  const groups = department.subcategories.map((subcategory, index) => ({
    subcategory,
    id: `subcategory-${index}`,
    products: products.filter((product) =>
      belongsToSubcategory(product, subcategory, department)
    ),
  }));
  const activeGroup =
    groups.find((group) => group.subcategory.name === selectedSubcategory) ?? groups[0];
  const productCount = new Set(groups.flatMap((group) => group.products.map((p) => p.id))).size;

  return (
    <div className="min-w-0 space-y-8">
      <div className="min-w-0 overflow-hidden rounded-3xl bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-400 px-8 py-7 text-white shadow-[0_18px_45px_rgba(14,165,233,0.22)]">
        <Link href="/" className="text-sm text-white/80 transition hover:text-white">
          首页 / 全部分类
        </Link>
        <h1 className="mt-3 break-words text-3xl font-bold tracking-tight">{department.name}</h1>
        <p className="mt-2 text-sm text-white/90">{department.description}</p>
        <p className="mt-1 text-xs text-white/75">
          共 {productCount} 件商品
        </p>
      </div>

      <SearchForm q={q} department={department.slug} />

      <nav aria-label="二级分类" className="flex flex-wrap gap-2">
        {groups.map((group) => (
          <Link
            key={group.id}
            href={buildDepartmentHref(department.slug, group.subcategory.name, q)}
            className={
              activeGroup?.id === group.id
                ? "rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-200"
                : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            }
          >
            {group.subcategory.name}
            <span className="ml-1.5 text-xs text-slate-400">{group.products.length}</span>
          </Link>
        ))}
      </nav>

      {activeGroup && (
        <section className="scroll-mt-28">
          <div className="mb-4 flex items-end justify-between border-b border-slate-200 pb-3">
            <h2 className="text-xl font-bold text-slate-900">{activeGroup.subcategory.name}</h2>
            <span className="text-sm text-slate-400">{activeGroup.products.length} 件商品</span>
          </div>
          <ProductGrid
            products={activeGroup.products}
            emptyText={`暂无${activeGroup.subcategory.name}商品`}
          />
        </section>
      )}
    </div>
  );
}

function belongsToSubcategory(
  product: ProductWithCategory,
  subcategory: Subcategory,
  department: Department
) {
  if (product.departmentSlug && product.subcategoryName) {
    return product.departmentSlug === department.slug && product.subcategoryName === subcategory.name;
  }
  const searchable = `${product.name} ${product.description} ${product.category.name}`.toLowerCase();
  const hasKeyword = (item: Subcategory) =>
    item.keywords.some((keyword) => searchable.includes(keyword.toLowerCase()));

  // Prefer a precise keyword match; legacy broad categories are only a fallback.
  if (department.subcategories.some(hasKeyword)) return hasKeyword(subcategory);
  return subcategory.categorySlugs?.includes(product.category.slug) ?? false;
}

function PageHeading({ title, count }: { title: string; count: number }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-sm text-slate-500">
        共 {count} 件商品
      </p>
    </div>
  );
}

function SearchForm({
  q,
  category,
  department,
}: {
  q?: string;
  category?: string;
  department?: string;
}) {
  return (
    <form method="GET" className="flex min-w-0 gap-2">
      {category && <input type="hidden" name="category" value={category} />}
      {department && <input type="hidden" name="department" value={department} />}
      <input
        type="search"
        name="q"
        defaultValue={q ?? ""}
        placeholder="搜索商品..."
        className="min-w-0 w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
      />
      <button type="submit" className="rounded-lg bg-orange-500 px-4 py-2 font-medium text-white transition hover:bg-orange-600">
        搜索
      </button>
    </form>
  );
}

function ProductGrid({
  products,
  emptyText = "未找到商品，换个关键词或分类试试。",
}: {
  products: ProductWithCategory[];
  emptyText?: string;
}) {
  if (products.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-sm text-slate-400">
        {emptyText}
      </p>
    );
  }
  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-4 md:grid-cols-4">
      {products.map((product) => <ProductCard key={product.id} product={product} />)}
    </div>
  );
}

function buildHref(q?: string, category?: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}

function buildDepartmentHref(department: string, subcategory: string, q?: string) {
  const params = new URLSearchParams({ department, subcategory });
  if (q) params.set("q", q);
  return `/products?${params.toString()}`;
}

function FilterChip({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={active
        ? "rounded-full bg-slate-900 px-4 py-1.5 text-sm font-medium text-white"
        : "rounded-full border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:border-slate-900"}
    >
      {label}
    </Link>
  );
}
