import type { MetadataRoute } from "next";
import { siteUrl } from "./lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Studio-only surfaces and the JSON API have nothing to offer a crawler.
      disallow: ["/ops", "/shopboard", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
