import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { getDb } from "../../db";
import { catalogProducts } from "../../db/schema";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { allProducts } from "../lib/catalog";
import type { CatalogProduct } from "../lib/catalog";
import { ShopExperience } from "./shop-experience";

export const metadata: Metadata = {
  title: "Shop Custom Gifts, Signs & Objects | Red Bucket Design Co",
  description: "Shop ready-made and customizable Red Bucket pieces, from engraved guitar hangers and serving boards to shotskis and illuminated signs.",
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product } = await searchParams;
  let products: CatalogProduct[] = allProducts;
  try {
    const rows = await getDb().select().from(catalogProducts).where(eq(catalogProducts.active, true)).orderBy(asc(catalogProducts.id));
    if (rows.length) products = rows.map((row) => ({ ...row, options: JSON.parse(row.optionsJson) as string[] }));
  } catch { /* Static catalog remains available while the store database initializes. */ }
  return <main id="main"><SiteHeader /><ShopExperience initialProductSlug={product} products={products} /><SiteFooter /></main>;
}
