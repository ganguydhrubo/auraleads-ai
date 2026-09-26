import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AuraLeads AI",
    short_name: "AuraLeads",
    description: "Instagram, Google Maps & WhatsApp lead generation.",
    start_url: "/",
    display: "standalone",
    background_color: "#F9FAFB",
    theme_color: "#3B50F5",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
