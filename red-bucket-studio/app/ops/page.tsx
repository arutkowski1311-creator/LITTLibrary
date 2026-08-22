import type { Metadata } from "next";
import { asc, desc } from "drizzle-orm";
import { getDb } from "../../db";
import { catalogProducts, customers, inquiries, paymentEvents, projects } from "../../db/schema";
import { requireChatGPTUser } from "../chatgpt-auth";
import { allProducts } from "../lib/catalog";
import type { CatalogProduct } from "../lib/catalog";
import { studioProjects } from "../lib/ops-data";
import type { StudioProject } from "../lib/ops-data";
import { OpsDashboard } from "./ops-dashboard";
import type { CustomerRecord, IdeaRecord, PaymentRecord } from "./ops-dashboard";

export const metadata: Metadata = { title: "Studio Dashboard", description: "Production, capacity, financial and project control for the Red Bucket workshop." };
export const dynamic = "force-dynamic";
export default async function OpsPage() {
  await requireChatGPTUser("/ops");
  let initialProjects: StudioProject[] = studioProjects;
  let initialProducts: CatalogProduct[] = allProducts;
  let initialCustomers: CustomerRecord[] = studioProjects.map((project, index) => ({ id: index + 1, name: project.customer, email: project.customerEmail ?? "", phone: project.customerPhone ?? "", shippingAddress: project.shippingAddress ?? "", billingAddress: "Same as shipping", totalSpent: project.paid, creditBalance: 0, notes: "" }));
  let initialPayments: PaymentRecord[] = [];
  let initialInquiries: IdeaRecord[] = [];
  try {
    const db = getDb();
    const [projectRows, productRows, customerRows, paymentRows, inquiryRows] = await Promise.all([
      db.select().from(projects).orderBy(asc(projects.due)), db.select().from(catalogProducts).orderBy(asc(catalogProducts.id)),
      db.select().from(customers).orderBy(asc(customers.name)), db.select().from(paymentEvents).orderBy(asc(paymentEvents.id)),
      db.select().from(inquiries).orderBy(desc(inquiries.createdAt)),
    ]);
    if (projectRows.length) initialProjects = projectRows;
    if (productRows.length) initialProducts = productRows.map((row) => ({ ...row, options: JSON.parse(row.optionsJson) as string[] }));
    if (customerRows.length) initialCustomers = customerRows;
    if (paymentRows.length) initialPayments = paymentRows;
    if (inquiryRows.length) initialInquiries = inquiryRows;
  } catch {
    // Keep the dashboard useful during a first deploy while D1 is being provisioned.
  }
  return <OpsDashboard initialProjects={initialProjects} initialProducts={initialProducts} initialCustomers={initialCustomers} initialPayments={initialPayments} initialInquiries={initialInquiries} />;
}
