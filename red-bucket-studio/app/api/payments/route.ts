import { getDb } from "../../../db";
import { paymentEvents } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

export async function POST(request: Request) {
  if (!(await getChatGPTUser())) return Response.json({ error: "Sign in required." }, { status: 401 });
  const payload = (await request.json()) as Record<string, unknown>; const projectId = Number(payload.projectId); const amount = Number(payload.amount); const type = String(payload.type ?? ""); const note = String(payload.note ?? "");
  if (!Number.isInteger(projectId) || !type || !Number.isFinite(amount) || amount <= 0) return Response.json({ error: "A valid action and amount are required." }, { status: 400 });
  try { const [payment] = await getDb().insert(paymentEvents).values({ projectId, type, amount, note, status: "pending" }).returning(); return Response.json({ payment }, { status: 201 }); }
  catch { return Response.json({ error: "Unable to record the payment action." }, { status: 500 }); }
}
