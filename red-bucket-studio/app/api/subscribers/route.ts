import { getDb } from "../../../db";
import { subscribers } from "../../../db/schema";

export async function POST(request: Request) {
  const payload = (await request.json()) as { email?: string };
  const email = payload.email?.trim().toLowerCase() ?? "";
  if (!/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: "A valid email is required." }, { status: 400 });

  try {
    const db = getDb();
    await db.insert(subscribers).values({ email }).onConflictDoNothing();
    return Response.json({ ok: true }, { status: 201 });
  } catch {
    return Response.json({ error: "Unable to subscribe right now." }, { status: 500 });
  }
}
