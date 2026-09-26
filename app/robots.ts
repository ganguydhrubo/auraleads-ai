import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app", "/login", "/signup", "/reset-password", "/auth", "/api"],
    },
    sitemap: "https://auraleads.online/sitemap.xml",
  };
}
