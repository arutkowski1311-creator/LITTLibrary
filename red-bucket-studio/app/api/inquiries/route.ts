import { getDb } from "../../../db";
import { inquiries } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { getChatGPTUser } from "../../chatgpt-auth";

export async function POST(request: Request) {
  const payload = (await request.json()) as Record<string, unknown>;
  const fields = ["name", "email", "phone", "person", "interest", "occasion", "budget", "story"] as const;
  const values = Object.fromEntries(fields.map((field) => [field, typeof payload[field] === "string" ? payload[field].trim() : ""])) as Record<typeof fields[number], string>;
  if (fields.some((field) => !values[field]) || !/^\S+@\S+\.\S+$/.test(values.email)) {
    return Response.json({ error: "Complete every field with a valid email." }, { status: 400 });
  }

  try {
    const db = getDb();
    const [inquiry] = await db.insert(inquiries).values({ ...values, source: typeof payload.source === "string" ? payload.source : "gift-finder", meetingStatus: "requested", status: "new" }).returning({ id: inquiries.id });
    return Response.json({ inquiry }, { status: 201 });
  } catch {
    return Response.json({ error: "Unable to send the idea right now." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await getChatGPTUser())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const payload = (await request.json()) as { id?: unknown; meetingStatus?: unknown; status?: unknown };
  const id = Number(payload.id);
  const meetingStatus = typeof payload.meetingStatus === "string" ? payload.meetingStatus.trim() : "";
  const status = typeof payload.status === "string" ? payload.status.trim() : "";
  if (!Number.isInteger(id) || !meetingStatus || !status) return Response.json({ error: "Invalid meeting update." }, { status: 400 });
  try {
    const db = getDb();
    await db.update(inquiries).set({ meetingStatus, status }).where(eq(inquiries.id, id));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Unable to update that meeting." }, { status: 500 });
  }
}
