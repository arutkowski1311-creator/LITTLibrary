import { env } from "cloudflare:workers";
import { getDb } from "../../../db";
import { inquiries } from "../../../db/schema";

const maxUploadBytes = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const form = await request.formData();
  const image = form.get("image");
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const phone = String(form.get("phone") ?? "").trim();
  const objectDescription = String(form.get("objectDescription") ?? "").trim();
  const dimensions = String(form.get("dimensions") ?? "").trim();
  const desiredUse = String(form.get("desiredUse") ?? "").trim();
  const budget = String(form.get("budget") ?? "").trim();

  if (!name || !/^\S+@\S+\.\S+$/.test(email) || !phone || !objectDescription || !desiredUse || !budget || !(image instanceof File)) return Response.json({ error: "Complete the form and add a photo." }, { status: 400 });
  if (!image.type.startsWith("image/") || image.size > maxUploadBytes) return Response.json({ error: "Use a JPG, PNG or WEBP image smaller than 8 MB." }, { status: 400 });

  const safeName = image.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-90);
  const imageKey = `second-act/${crypto.randomUUID()}-${safeName}`;
  try {
    await env.BUCKET.put(imageKey, await image.arrayBuffer(), { httpMetadata: { contentType: image.type } });
    const [inquiry] = await getDb().insert(inquiries).values({
      name, email, phone, person: "Found-object owner", interest: "Found-object transformation", occasion: "Second Act collaboration", budget,
      story: `${objectDescription}\n\nPossible direction: ${desiredUse}`, source: "second-act", imageKey, imageName: image.name,
      objectDescription, dimensions, desiredUse, meetingStatus: "requested", status: "new",
    }).returning({ id: inquiries.id });
    return Response.json({ inquiry }, { status: 201 });
  } catch {
    await env.BUCKET.delete(imageKey).catch(() => undefined);
    return Response.json({ error: "The idea could not be saved right now." }, { status: 500 });
  }
}
