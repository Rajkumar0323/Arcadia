import type { MetadataRoute } from "next";

const name = process.env.NEXT_PUBLIC_APP_NAME ?? "Arcadia";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${name} — Student Arcade`,
    short_name: name,
    description: "Join clubs, play arcade challenges, climb leaderboards and win course discounts.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#06050d",
    theme_color: "#06050d",
    categories: ["education", "games"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Clubs", url: "/clubs" },
      { name: "Rewards", url: "/rewards" },
    ],
  };
}
