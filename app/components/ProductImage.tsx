"use client";

import { useEffect, useState } from "react";
import { normalizeProductImageUrl } from "@/lib/product-images";

type ProductImageProps = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
};

export default function ProductImage({ src, alt, sizes, className = "", priority }: ProductImageProps) {
  const normalizedSrc = normalizeProductImageUrl(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [normalizedSrc]);

  if (failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-100 px-3 text-center text-sm text-slate-400" role="img" aria-label={`${alt}图片加载失败`}>
        图片无法加载
      </div>
    );
  }

  return (
    // Product hosts are administrator-provided, so direct loading is more reliable than
    // routing them through Next's build-time host allowlist and image optimizer.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={normalizedSrc}
      alt={alt}
      sizes={sizes}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={`absolute inset-0 h-full w-full ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
