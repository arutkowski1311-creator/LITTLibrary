import { getDb } from "../../../db";
import { communications } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

export async function POST(request: Request) {
  if (!(await getChatGPTUser())) return Response.json({ error: "Sign in required." }, { status: 401 });
  const payload = (await request.json()) as Record<string, unknown>;
  const projectId = Number(payload.projectId); const channel = String(payload.channel ?? ""); const subject = String(payload.subject ?? "").trim(); const message = String(payload.message ?? "").trim();
  if (!Number.isInteger(projectId) || !channel || !subject || !message) return Response.json({ error: "Complete the message." }, { status: 400 });
  try { const [communication] = await getDb().insert(communications).values({ projectId, channel, subject, message, status: "opened in client" }).returning(); return Response.json({ communication }, { status: 201 }); }
  catch { return Response.json({ error: "Unable to save the communication." }, { status: 500 }); }
}
