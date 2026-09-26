import type { MetadataRoute } from "next";

// Only lists pages actually meant to be indexed. /login, /signup, /app etc.
// are transactional/auth-gated, not content pages, and are excluded from
// crawling in robots.ts — no point listing them here either.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://auraleads.online",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
