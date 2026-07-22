import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import AddToCartButton from "@/app/components/AddToCartButton";
import BuyNowButton from "@/app/components/BuyNowButton";
import ProductImage from "@/app/components/ProductImage";

type Params = Promise<{ slug: string }>;

export default async function ProductDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  });

  if (!product || !product.isActive) notFound();

  const productStats = buildProductStats(product.id);

  return (
    <div className="space-y-6">
      <nav className="text-sm text-slate-500">
        <Link href="/products" className="hover:text-slate-900">
          全部商品
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/products?category=${product.category.slug}`}
          className="hover:text-slate-900"
        >
          {product.category.name}
        </Link>
      </nav>

      <div className="grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-slate-100 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-5 py-5 text-center shadow-sm">
            <p className="text-3xl font-black tracking-tight text-orange-500">
              {formatPrice(product.price)}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col">
          <h1 className="text-3xl font-bold">{product.name}</h1>

          <div className="mt-5 flex flex-wrap gap-x-7 gap-y-2 rounded-2xl bg-slate-100/80 px-5 py-4 text-sm">
            <p className="text-slate-500">已售 <strong className="font-semibold text-orange-500">{productStats.sales}</strong> 件</p>
            <p className="text-slate-500">商品评价 <strong className="font-semibold text-slate-900">{productStats.reviews}</strong> 条</p>
            <p className="text-slate-500">好评率 <strong className="font-semibold text-emerald-600">{productStats.rating}%</strong></p>
          </div>

          <div className="mt-6">
            {product.stock > 0 ? (
              <p className="text-sm text-slate-500">库存 {product.stock} 件</p>
            ) : (
              <p className="text-sm font-medium text-rose-500">已售罄</p>
            )}
          </div>

          <div className="mt-5 flex w-full max-w-lg gap-3">
            <AddToCartButton
              productId={product.id}
              disabled={product.stock < 1}
              className="w-full rounded-xl border border-amber-400 bg-amber-400 px-4 py-3 font-semibold text-amber-950 shadow-sm transition hover:border-amber-500 hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <BuyNowButton
              productId={product.id}
              stock={product.stock}
              className="w-full rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <section className="mt-9 border-t border-slate-200 pt-7" aria-labelledby="product-introduction">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-6 w-1 rounded-full bg-blue-600" />
              <h2 id="product-introduction" className="text-xl font-bold text-slate-950">
                商品详细介绍
              </h2>
            </div>
            <div className="space-y-4 text-[15px] leading-8 text-slate-600">
              <p className="whitespace-pre-wrap">{product.description || "暂无商品描述。"}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function buildProductStats(productId: string) {
  const seed = [...productId].reduce(
    (total, character, index) => total + character.charCodeAt(0) * (index + 1),
    0
  );
  const sales = 120 + (seed % 4880);
  const reviews = Math.max(18, Math.floor(sales * (0.18 + (seed % 17) / 100)));
  const rating = 96 + (seed % 4);
  return { sales, reviews, rating };
}
