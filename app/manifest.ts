import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Coach FI — Financial Education",
    short_name: "Coach FI",
    description:
      "AI-powered financial education coach. Learn saving habits, beat inflation and earn NFT certificates on Solana.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFF",
    theme_color: "#7668E8",
    orientation: "portrait-primary",
    categories: ["education", "finance", "productivity"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [],
  };
}
