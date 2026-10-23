import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Coach FI — Financial Education",
    short_name: "Coach FI",
    description:
      "AI-powered financial education coach. Learn saving habits, beat inflation and earn certificates on Solana.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF8EE",
    theme_color: "#EBE1FF",
    orientation: "portrait-primary",
    categories: ["education", "finance", "productivity"],
    icons: [
      {
        src: "/brand/app-icons/app-icon-adult-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/brand/app-icons/app-icon-adult-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [],
  };
}
