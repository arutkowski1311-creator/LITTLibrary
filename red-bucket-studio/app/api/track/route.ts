import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { projects } from "../../../db/schema";

export async function POST(request: Request) {
  const payload = (await request.json()) as { code?: string; email?: string };
  const code = payload.code?.trim().toUpperCase() ?? "";
  const email = payload.email?.trim().toLowerCase() ?? "";
  if (!code || !/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: "Enter your project code and email." }, { status: 400 });

  try {
    const [project] = await getDb().select({
      code: projects.code,
      name: projects.name,
      status: projects.status,
      stage: projects.stage,
      dueLabel: projects.dueLabel,
      progress: projects.progress,
    }).from(projects).where(and(eq(projects.code, code), eq(projects.customerEmail, email))).limit(1);
    return project ? Response.json({ project }) : Response.json({ error: "We could not match that code and email." }, { status: 404 });
  } catch {
    return Response.json({ error: "Tracking is temporarily unavailable." }, { status: 500 });
  }
}
