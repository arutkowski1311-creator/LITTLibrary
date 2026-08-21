import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  customer: text("customer").notNull(),
  customerEmail: text("customer_email").notNull().default(""),
  customerPhone: text("customer_phone").notNull().default(""),
  customerId: integer("customer_id"),
  kind: text("kind").notNull().default("Commission"),
  priority: text("priority").notNull().default("Standard"),
  deliverySpeed: text("delivery_speed").notNull().default("Standard"),
  orderStatus: text("order_status").notNull().default("Open"),
  paymentStatus: text("payment_status").notNull().default("Deposit due"),
  shippingAddress: text("shipping_address").notNull().default(""),
  materialsNeeded: text("materials_needed").notNull().default(""),
  status: text("status").notNull().default("Design"),
  stage: text("stage").notNull().default("New inquiry"),
  due: text("due").notNull(),
  dueLabel: text("due_label").notNull(),
  estimate: real("estimate").notNull().default(0),
  logged: real("logged").notNull().default(0),
  remaining: real("remaining").notNull().default(0),
  value: real("value").notNull().default(0),
  paid: real("paid").notNull().default(0),
  progress: integer("progress").notNull().default(0),
  next: text("next_action").notNull().default("Review project brief"),
  blocker: text("blocker").notNull().default(""),
  color: text("color").notNull().default("red"),
  boardHidden: integer("board_hidden", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().default(""),
  shippingAddress: text("shipping_address").notNull().default(""),
  billingAddress: text("billing_address").notNull().default(""),
  totalSpent: real("total_spent").notNull().default(0),
  creditBalance: real("credit_balance").notNull().default(0),
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const catalogProducts = sqliteTable("catalog_products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  detail: text("detail").notNull(),
  price: real("price").notNull(),
  inventory: integer("inventory").notNull().default(0),
  leadTimeDays: integer("lead_time_days").notNull().default(10),
  materials: text("materials").notNull().default(""),
  optionsJson: text("options_json").notNull().default("[]"),
  image: text("image").notNull(),
  alt: text("alt").notNull(),
  badge: text("badge").notNull().default("Custom"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const communications = sqliteTable("communications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull(),
  channel: text("channel").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("drafted"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const paymentEvents = sqliteTable("payment_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull(),
  type: text("type").notNull(),
  amount: real("amount").notNull(),
  status: text("status").notNull().default("pending"),
  note: text("note").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const designBriefs = sqliteTable("design_briefs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().unique(),
  dimensions: text("dimensions").notNull().default(""),
  materials: text("materials").notNull().default(""),
  customization: text("customization").notNull().default(""),
  renderingImage: text("rendering_image").notNull().default(""),
  timeline: text("timeline").notNull().default(""),
  paymentStatus: text("payment_status").notNull().default("Deposit due"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const subscribers = sqliteTable("subscribers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const inquiries = sqliteTable("inquiries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  person: text("person").notNull(),
  interest: text("interest").notNull(),
  occasion: text("occasion").notNull().default(""),
  budget: text("budget").notNull(),
  story: text("story").notNull(),
  source: text("source").notNull().default("gift-finder"),
  imageKey: text("image_key").notNull().default(""),
  imageName: text("image_name").notNull().default(""),
  objectDescription: text("object_description").notNull().default(""),
  dimensions: text("dimensions").notNull().default(""),
  desiredUse: text("desired_use").notNull().default(""),
  meetingStatus: text("meeting_status").notNull().default("requested"),
  status: text("status").notNull().default("new"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
