import type { MetadataRoute } from "next";
import { siteUrl } from "./lib/site";

/** Public pages only. /ops and /shopboard are behind sign-in. */
const routes: { path: string; priority: number; changeFrequency: "weekly" | "monthly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/shop", priority: 0.9, changeFrequency: "weekly" },
  { path: "/gift-finder", priority: 0.9, changeFrequency: "monthly" },
  { path: "/second-act", priority: 0.8, changeFrequency: "monthly" },
  { path: "/commercial", priority: 0.8, changeFrequency: "monthly" },
  { path: "/work", priority: 0.7, changeFrequency: "monthly" },
  { path: "/track", priority: 0.3, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${siteUrl}${path}`,
    changeFrequency,
    priority,
  }));
}
