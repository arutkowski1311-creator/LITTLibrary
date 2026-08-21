import { getDb } from "../../../db";
import { designBriefs } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

export async function POST(request: Request) {
  if (!(await getChatGPTUser())) return Response.json({ error: "Sign in required." }, { status: 401 });
  const payload = (await request.json()) as Record<string, unknown>; const projectId = Number(payload.projectId);
  if (!Number.isInteger(projectId)) return Response.json({ error: "Project is required." }, { status: 400 });
  const values = { projectId, dimensions: String(payload.dimensions ?? ""), materials: String(payload.materials ?? ""), customization: String(payload.customization ?? ""), renderingImage: String(payload.renderingImage ?? ""), timeline: String(payload.timeline ?? ""), paymentStatus: String(payload.paymentStatus ?? "Deposit due"), updatedAt: new Date().toISOString() };
  try { const [brief] = await getDb().insert(designBriefs).values(values).onConflictDoUpdate({ target: designBriefs.projectId, set: values }).returning(); return Response.json({ brief }, { status: 201 }); }
  catch { return Response.json({ error: "Unable to save the brief." }, { status: 500 }); }
}
