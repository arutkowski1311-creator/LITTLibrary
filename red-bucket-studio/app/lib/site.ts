/**
 * Canonical origin for metadata, sitemap and structured data.
 *
 * Set `SITE_URL` in the hosting environment when the site moves to its own
 * domain; everything that builds an absolute URL reads it from here.
 */
export const siteUrl =
  process.env.SITE_URL ?? "https://red-bucket-studio.adamrutkowski325.chatgpt.site";

export const studio = {
  name: "Red Bucket Design Co",
  email: "redbucketdesignco@gmail.com",
  city: "Bridgewater",
  region: "NJ",
  regionName: "New Jersey",
  country: "US",
} as const;
