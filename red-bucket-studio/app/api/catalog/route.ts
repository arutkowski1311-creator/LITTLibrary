import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { catalogProducts } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

export async function PATCH(request: Request) {
  if (!(await getChatGPTUser())) return Response.json({ error: "Sign in required." }, { status: 401 });
  const payload = (await request.json()) as Record<string, unknown>;
  const slug = typeof payload.slug === "string" ? payload.slug : "";
  if (!slug) return Response.json({ error: "Product slug is required." }, { status: 400 });
  try {
    const [product] = await getDb().update(catalogProducts).set({
      ...(typeof payload.name === "string" ? { name: payload.name } : {}),
      ...(typeof payload.detail === "string" ? { detail: payload.detail } : {}),
      ...(typeof payload.price === "number" ? { price: Math.max(0, payload.price) } : {}),
      ...(typeof payload.inventory === "number" ? { inventory: Math.max(0, Math.round(payload.inventory)) } : {}),
      ...(typeof payload.leadTimeDays === "number" ? { leadTimeDays: Math.max(1, Math.round(payload.leadTimeDays)) } : {}),
      ...(typeof payload.materials === "string" ? { materials: payload.materials } : {}),
      ...(Array.isArray(payload.options) ? { optionsJson: JSON.stringify(payload.options) } : {}),
      ...(typeof payload.active === "boolean" ? { active: payload.active } : {}),
      updatedAt: new Date().toISOString(),
    }).where(eq(catalogProducts.slug, slug)).returning();
    return product ? Response.json({ product }) : Response.json({ error: "Product not found." }, { status: 404 });
  } catch { return Response.json({ error: "Unable to update the product." }, { status: 500 }); }
}
