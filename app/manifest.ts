import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "迷你商城",
    short_name: "迷你商城",
    description: "随时随地发现好物",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#2563eb",
    orientation: "portrait-primary",
    lang: "zh-CN",
    categories: ["shopping", "lifestyle"],
    icons: [
      { src: "/icon.png", sizes: "256x256", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
