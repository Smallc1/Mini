import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/checkout/", "/profile/", "/orders/"] }, sitemap: `${base}/sitemap.xml` };
}
