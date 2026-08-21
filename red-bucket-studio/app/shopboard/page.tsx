import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { getDb } from "../../db";
import { projects } from "../../db/schema";
import { requireChatGPTUser } from "../chatgpt-auth";
import { studioProjects } from "../lib/ops-data";
import type { StudioProject } from "../lib/ops-data";
import { Shopboard } from "./shopboard";

export const metadata: Metadata = { title: "Red Bucket Shopboard", description: "Full-screen daily production board for the Red Bucket workshop." };
export default async function ShopboardPage() {
  await requireChatGPTUser("/shopboard");
  let boardProjects: StudioProject[] = studioProjects;
  try {
    const rows = await getDb().select().from(projects).orderBy(asc(projects.due));
    if (rows.length) boardProjects = rows;
  } catch {
    // Seeded project data remains available until D1 is ready.
  }
  return <Shopboard projects={boardProjects} />;
}
