import { asc, eq } from "drizzle-orm";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { projects } from "../../../db/schema";

async function authorized() {
  return Boolean(await getChatGPTUser());
}

export async function GET() {
  if (!(await authorized())) return Response.json({ error: "Sign in required." }, { status: 401 });
  try {
    const rows = await getDb().select().from(projects).orderBy(asc(projects.due));
    return Response.json({ projects: rows });
  } catch {
    return Response.json({ error: "Project data is unavailable." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await authorized())) return Response.json({ error: "Sign in required." }, { status: 401 });
  const payload = (await request.json()) as Record<string, unknown>;
  const code = typeof payload.code === "string" ? payload.code.trim().toUpperCase() : "";
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const customer = typeof payload.customer === "string" ? payload.customer.trim() : "";
  const customerEmail = typeof payload.customerEmail === "string" ? payload.customerEmail.trim().toLowerCase() : "";
  const customerPhone = typeof payload.customerPhone === "string" ? payload.customerPhone.trim() : "";
  const due = typeof payload.due === "string" ? payload.due : "";
  if (!code || !name || !customer || !/^\S+@\S+\.\S+$/.test(customerEmail) || !/^\d{4}-\d{2}-\d{2}$/.test(due)) return Response.json({ error: "Code, project, customer, email and due date are required." }, { status: 400 });
  const dueLabel = new Date(`${due}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

  try {
    const [project] = await getDb().insert(projects).values({
      code, name, customer, customerEmail, customerPhone, due, dueLabel,
      kind: typeof payload.kind === "string" ? payload.kind : "Commission",
      priority: typeof payload.priority === "string" ? payload.priority : "Standard",
      deliverySpeed: typeof payload.deliverySpeed === "string" ? payload.deliverySpeed : "Standard",
      paymentStatus: typeof payload.paymentStatus === "string" ? payload.paymentStatus : "Payment due",
      shippingAddress: typeof payload.shippingAddress === "string" ? payload.shippingAddress : "",
      materialsNeeded: typeof payload.materialsNeeded === "string" ? payload.materialsNeeded : "",
      status: "Ordered", stage: "Ordered", estimate: Number(payload.estimate) || 0,
      remaining: Number(payload.estimate) || 0, value: Number(payload.value) || 0,
    }).returning();
    return Response.json({ project }, { status: 201 });
  } catch {
    return Response.json({ error: "That project code may already exist." }, { status: 409 });
  }
}

export async function PATCH(request: Request) {
  if (!(await authorized())) return Response.json({ error: "Sign in required." }, { status: 401 });
  const payload = (await request.json()) as Record<string, unknown>;
  const id = Number(payload.id);
  if (!Number.isInteger(id)) return Response.json({ error: "A project id is required." }, { status: 400 });
  const updates = {
    ...(typeof payload.status === "string" ? { status: payload.status } : {}),
    ...(typeof payload.stage === "string" ? { stage: payload.stage } : {}),
    ...(typeof payload.next === "string" ? { next: payload.next } : {}),
    ...(typeof payload.blocker === "string" ? { blocker: payload.blocker } : {}),
    ...(typeof payload.due === "string" ? { due: payload.due } : {}),
    ...(typeof payload.dueLabel === "string" ? { dueLabel: payload.dueLabel } : {}),
    ...(typeof payload.priority === "string" ? { priority: payload.priority } : {}),
    ...(typeof payload.orderStatus === "string" ? { orderStatus: payload.orderStatus } : {}),
    ...(typeof payload.paymentStatus === "string" ? { paymentStatus: payload.paymentStatus } : {}),
    ...(typeof payload.materialsNeeded === "string" ? { materialsNeeded: payload.materialsNeeded } : {}),
    ...(typeof payload.shippingAddress === "string" ? { shippingAddress: payload.shippingAddress } : {}),
    ...(typeof payload.value === "number" ? { value: Math.max(0, payload.value) } : {}),
    ...(typeof payload.paid === "number" ? { paid: Math.max(0, payload.paid) } : {}),
    ...(typeof payload.progress === "number" ? { progress: Math.max(0, Math.min(100, payload.progress)) } : {}),
    ...(typeof payload.logged === "number" ? { logged: Math.max(0, payload.logged) } : {}),
    ...(typeof payload.remaining === "number" ? { remaining: Math.max(0, payload.remaining) } : {}),
    ...(typeof payload.boardHidden === "boolean" ? { boardHidden: payload.boardHidden } : {}),
    updatedAt: new Date().toISOString(),
  };
  try {
    const [project] = await getDb().update(projects).set(updates).where(eq(projects.id, id)).returning();
    return project ? Response.json({ project }) : Response.json({ error: "Project not found." }, { status: 404 });
  } catch {
    return Response.json({ error: "Unable to update the project." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await authorized())) return Response.json({ error: "Sign in required." }, { status: 401 });
  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  if (!Number.isInteger(id)) return Response.json({ error: "A project id is required." }, { status: 400 });
  try {
    const [project] = await getDb().delete(projects).where(eq(projects.id, id)).returning({ id: projects.id });
    return project ? Response.json({ ok: true }) : Response.json({ error: "Project not found." }, { status: 404 });
  } catch {
    return Response.json({ error: "Unable to delete the project." }, { status: 500 });
  }
}
