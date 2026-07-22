"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Department } from "@/lib/catalog";

type RecommendationItem = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  action: string;
  icon: string;
  background: string;
  accent: string;
};

const themes = [
  { background: "from-[#ffedd5] via-[#fed7aa] to-[#fb7185]", accent: "bg-rose-600 hover:bg-rose-700" },
  { background: "from-[#cffafe] via-[#bae6fd] to-[#60a5fa]", accent: "bg-blue-600 hover:bg-blue-700" },
  { background: "from-[#ecfccb] via-[#d9f99d] to-[#6ee7b7]", accent: "bg-emerald-700 hover:bg-emerald-800" },
  { background: "from-[#fce7f3] via-[#fbcfe8] to-[#fda4af]", accent: "bg-pink-600 hover:bg-pink-700" },
  { background: "from-[#e0e7ff] via-[#c7d2fe] to-[#a78bfa]", accent: "bg-violet-600 hover:bg-violet-700" },
  { background: "from-[#fef3c7] via-[#fde68a] to-[#f59e0b]", accent: "bg-amber-700 hover:bg-amber-800" },
] as const;

function buildRecommendationGroups(departments: Department[]): RecommendationItem[][] {
  const items = departments.flatMap((department) => {
    const subcategories = department.subcategories.length
      ? department.subcategories
      : [{ name: department.name, keywords: [] }];

    return subcategories.map((subcategory, subcategoryIndex) => {
      const params = new URLSearchParams({ department: department.slug });
      if (department.subcategories.length) params.set("subcategory", subcategory.name);
      const theme = themes[(subcategoryIndex + departments.indexOf(department)) % themes.length];

      return {
        eyebrow: department.name,
        title: `发现${subcategory.name}好物`,
        description: `${department.description}。当前为你精选${subcategory.name}商品。`,
        href: `/products?${params.toString()}`,
        action: `选购${subcategory.name}`,
        icon: department.icon,
        ...theme,
      };
    });
  });

  const groups: RecommendationItem[][] = [[], [], []];
  items.forEach((item, index) => groups[index % groups.length].push(item));
  return groups;
}

export default function RecommendationCarousel({ departments }: { departments: Department[] }) {
  const recommendationGroups = buildRecommendationGroups(departments);

  return (
    <section aria-labelledby="recommendation-title" className="space-y-4">
      <h2 id="recommendation-title" className="text-2xl font-bold tracking-tight text-slate-950">
        为你精选
      </h2>
      <div className="grid min-h-[520px] h-[calc(100vh-7rem)] max-h-[760px] grid-cols-1 gap-4 rounded-[2rem] bg-white/70 p-4 shadow-[0_22px_65px_rgba(15,23,42,0.12)] md:grid-cols-3">
        <CarouselColumn items={recommendationGroups[0]} interval={4200} />
        <CarouselColumn items={recommendationGroups[1]} interval={5000} showDots />
        <CarouselColumn items={recommendationGroups[2]} interval={4600} />
      </div>
    </section>
  );
}

function CarouselColumn({
  items,
  interval,
  showDots = false,
}: {
  items: RecommendationItem[];
  interval: number;
  showDots?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % items.length), interval);
    return () => window.clearInterval(timer);
  }, [interval, items.length, paused]);

  function move(direction: number) {
    setActiveIndex((current) => (current + direction + items.length) % items.length);
  }

  return (
    <div className="relative min-h-0 overflow-hidden rounded-[1.5rem]" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div
        className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {items.map((item) => (
          <article
            key={item.title}
            className={`relative h-full min-w-full overflow-hidden bg-gradient-to-br ${item.background}`}
          >
            <Link
              href={item.href}
              aria-label={`${item.title}：${item.action}`}
              className="group relative z-10 flex h-full flex-col justify-between p-7 outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white/90 sm:p-9"
            >
              <div>
                <p className="text-[11px] font-black tracking-[0.2em] text-slate-700/70">{item.eyebrow}</p>
                <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-950 lg:text-3xl">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-700 lg:text-base">{item.description}</p>
              </div>
              <span
                className={`relative z-10 mb-5 inline-flex w-fit rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-lg transition group-hover:-translate-y-0.5 ${item.accent}`}
              >
                {item.action}
              </span>
              <span className="pointer-events-none absolute -bottom-8 -right-5 select-none text-[9rem] opacity-60 drop-shadow-2xl lg:text-[12rem]">
                {item.icon}
              </span>
            </Link>
          </article>
        ))}
      </div>

      {items.length > 1 && <>
        <button type="button" onClick={() => move(-1)} aria-label="上一个推荐" className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-xl text-slate-900 shadow-lg backdrop-blur transition hover:scale-110 hover:bg-white">‹</button>
        <button type="button" onClick={() => move(1)} aria-label="下一个推荐" className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-xl text-slate-900 shadow-lg backdrop-blur transition hover:scale-110 hover:bg-white">›</button>
      </>}

      {showDots && items.length > 1 && (
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-full bg-white/65 px-3 py-2 backdrop-blur">
          {items.map((item, index) => (
            <button
              key={item.title}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`切换到第 ${index + 1} 个推荐`}
              aria-current={activeIndex === index ? "true" : undefined}
              className={`h-2 rounded-full transition-all ${activeIndex === index ? "w-7 bg-slate-900" : "w-2 bg-slate-500/50 hover:bg-slate-700"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
