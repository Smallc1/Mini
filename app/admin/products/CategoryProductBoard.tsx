import ProductImage from "@/app/components/ProductImage";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import DeleteProductButton from "./DeleteProductButton";
import ProductStatusControl from "./ProductStatusControl";
import StockControl from "./StockControl";

type ProductItem = {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  stock: number;
  isActive: boolean;
  sales: number;
};

type CategoryColumn = {
  id: string;
  name: string;
  products: ProductItem[];
};

export default function CategoryProductBoard({ categories }: { categories: CategoryColumn[] }) {
  if (categories.length === 0) {
    return <div className="rounded-xl border border-slate-200 bg-white px-4 py-16 text-center text-slate-400">没有找到符合条件的商品。</div>;
  }

  const singleCategory = categories.length === 1;

  return (
    <div className="overflow-x-auto pb-3">
      <div className={singleCategory ? "w-full" : "flex min-w-max items-start gap-4"}>
        {categories.map((category) => (
          <section key={category.id} className={singleCategory ? "w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100/70" : "w-[310px] shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100/70"}>
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
              <h3 className="font-semibold text-slate-900">{category.name}</h3>
              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-600">{category.products.length} 件</span>
            </header>
            <div className={singleCategory ? "grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "max-h-[68vh] space-y-3 overflow-y-auto p-3"}>
              {category.products.map((product) => (
                <article key={product.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      <ProductImage src={product.imageUrl} alt={product.name} sizes="64px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium leading-5 text-slate-900">{product.name}</p>
                      <p className="mt-1 font-semibold text-orange-500">{formatPrice(product.price)}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-500">库存数量</span>
                    <StockControl id={product.id} initialStock={product.stock} />
                  </div>
                  <div className="mt-2 text-right text-xs text-slate-400">销量 {product.sales}</div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <ProductStatusControl id={product.id} initialActive={product.isActive} />
                    <div className="ml-3 flex items-center gap-3 text-xs">
                      <Link href={`/admin/products/${product.id}/edit`} className="text-blue-600 hover:underline">编辑</Link>
                      <DeleteProductButton id={product.id} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
