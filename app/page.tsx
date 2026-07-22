import Link from "next/link";
import { getCatalogDepartments } from "@/lib/catalog-db";
import RecommendationCarousel from "./components/RecommendationCarousel";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const departments = await getCatalogDepartments();
  return (
    <div className="space-y-10">
      <section
        aria-label="商品分类"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5"
      >
        {departments.map((item) => (
          <Link
            key={item.slug}
            href={`/products?department=${item.slug}`}
            className="group flex flex-col items-center rounded-3xl border border-transparent bg-white/80 px-3 py-5 text-center shadow-[0_14px_40px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_52px_rgba(15,23,42,0.1)] hover:ring-slate-300"
          >
            <span
              className={`flex h-16 w-16 items-center justify-center rounded-full text-3xl shadow-inner transition duration-300 group-hover:scale-110 ${item.tint}`}
            >
              {item.icon}
            </span>
            <span className="mt-3 text-sm font-semibold text-slate-700 transition group-hover:text-slate-950">
              {item.name}
            </span>
          </Link>
        ))}
      </section>

      <RecommendationCarousel departments={departments} />
    </div>
  );
}
