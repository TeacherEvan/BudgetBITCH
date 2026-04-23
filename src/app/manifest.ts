import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BudgetBITCH",
    short_name: "BudgetBITCH",
    description: "Install BudgetBITCH for faster access to your budget dashboard.",
    start_url: "/",
    display: "standalone",
    background_color: "#081512",
    theme_color: "#081512",
    icons: [
      {
        src: "/icons/app-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/app-icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}