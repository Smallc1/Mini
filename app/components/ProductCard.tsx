import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import AddToCartButton from "./AddToCartButton";
import BuyNowButton from "./BuyNowButton";
import ProductImage from "./ProductImage";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    imageUrl: string;
    stock: number;
    category: { name: string };
  };
  showCategory?: boolean;
  showStock?: boolean;
};

export default function ProductCard({
  product,
  showCategory = true,
  showStock = true,
}: ProductCardProps) {
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(15,23,42,0.08)]">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]"
      >
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {showCategory && (
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            {product.category.name}
          </span>
        )}
        <Link
          href={`/products/${product.slug}`}
          className="mt-1 line-clamp-2 text-[15px] font-semibold leading-6 tracking-tight text-slate-900 transition hover:text-blue-600"
        >
          {product.name}
        </Link>
        <div className="mt-auto pt-3">
          <div className="flex items-end justify-between gap-3">
            <span className="text-lg font-semibold text-orange-500">
              {formatPrice(product.price)}
            </span>
            {showStock && (product.stock > 0 ? (
              <span className="text-xs text-slate-400">
                库存 {product.stock}
              </span>
            ) : (
              <span className="text-xs text-rose-500">已售罄</span>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <AddToCartButton
              productId={product.id}
              disabled={product.stock < 1}
              className="w-full whitespace-nowrap rounded-xl border border-amber-400 bg-amber-400 px-2 py-2.5 text-xs font-semibold text-amber-950 shadow-sm transition hover:border-amber-500 hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
            />
            <BuyNowButton
              productId={product.id}
              stock={product.stock}
              className="w-full whitespace-nowrap rounded-xl bg-orange-500 px-2 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
