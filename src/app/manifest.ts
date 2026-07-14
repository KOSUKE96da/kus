import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "KuroFeed",
    short_name: "KuroFeed",
    description: "お気に入りのRSSフィードを一箇所で管理するアプリ",
    start_url: "/",
    display: "standalone",
    // Dark app: splash background must match, otherwise a white flash shows on launch.
    background_color: "#030712",
    theme_color: "#FACC15",
    orientation: "portrait",
    dir: "ltr",
    lang: "ja",
    categories: ["news", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
