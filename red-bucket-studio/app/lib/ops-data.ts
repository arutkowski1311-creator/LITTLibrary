export type StudioProject = {
  id: number; code: string; name: string; customer: string; status: string; stage: string; due: string; dueLabel: string;
  estimate: number; logged: number; remaining: number; value: number; paid: number; progress: number; next: string; blocker: string; color: string;
  customerEmail?: string; customerPhone?: string; customerId?: number | null; kind?: string; priority?: string; deliverySpeed?: string;
  orderStatus?: string; paymentStatus?: string; shippingAddress?: string; materialsNeeded?: string;
  boardHidden?: boolean; createdAt?: string; updatedAt?: string;
};

export const studioProjects: StudioProject[] = [
  { id: 1, code: "RB-241", name: "Firehouse bar", customer: "M. Delaney", customerEmail: "m.delaney@example.com", customerPhone: "908-555-0142", kind: "Commission", priority: "Standard", deliverySpeed: "Freight", orderStatus: "Open", paymentStatus: "50% paid", shippingAddress: "Morristown, NJ", materialsNeeded: "Fire-truck rear panel · steel tube · walnut", status: "Fabricate", stage: "Frame fabrication", due: "2026-09-18", dueLabel: "29 days", estimate: 38, logged: 21.5, remaining: 18, value: 6400, paid: 3200, progress: 62, next: "Weld lower cabinet frame", blocker: "", color: "red" },
  { id: 2, code: "RB-244", name: "Aviation coffee table", customer: "J. Archer", customerEmail: "j.archer@example.com", customerPhone: "201-555-0188", kind: "Commission", priority: "Standard", deliverySpeed: "White glove", orderStatus: "Hold", paymentStatus: "Deposit paid", shippingAddress: "Hoboken, NJ", materialsNeeded: "Aircraft wing · tempered glass · steel legs", status: "Design", stage: "Concept approved", due: "2026-10-02", dueLabel: "43 days", estimate: 44, logged: 8.5, remaining: 36, value: 8200, paid: 2500, progress: 28, next: "Confirm glass dimensions", blocker: "Waiting on glass vendor", color: "gold" },
  { id: 3, code: "RB-247", name: "Lighted studio sign", customer: "Stride Fitness", customerEmail: "studio@stride.example", customerPhone: "973-555-0126", kind: "Semi-custom", priority: "Rush", deliverySpeed: "Rush · 3 day", orderStatus: "Open", paymentStatus: "Paid", shippingAddress: "Montclair, NJ", materialsNeeded: "Black acrylic · LED strip · oak backer", status: "Package", stage: "Finishing", due: "2026-08-23", dueLabel: "3 days", estimate: 16, logged: 13, remaining: 3.5, value: 1750, paid: 1750, progress: 84, next: "Wire LED backer", blocker: "", color: "green" },
  { id: 4, code: "RB-250", name: "Colorado shotski", customer: "A. Sullivan", customerEmail: "asullivan@example.com", customerPhone: "908-555-0171", kind: "Semi-custom", priority: "Expedited", deliverySpeed: "Priority · 6 day", orderStatus: "Approval", paymentStatus: "Paid", shippingAddress: "Boulder, CO", materialsNeeded: "Vintage ski · 4 shot cups · CU colors", status: "Design", stage: "Awaiting approval", due: "2026-08-27", dueLabel: "7 days", estimate: 7, logged: 2, remaining: 5, value: 285, paid: 285, progress: 18, next: "Release engraving files", blocker: "Customer approval overdue", color: "blue" },
  { id: 5, code: "RB-252", name: "Anniversary serving board", customer: "S. Morgan", customerEmail: "smorgan@example.com", customerPhone: "732-555-0193", kind: "Semi-custom", priority: "Rush", deliverySpeed: "Rush · 3 day", orderStatus: "Open", paymentStatus: "Paid", shippingAddress: "Princeton, NJ", materialsNeeded: "Walnut blank · food-safe oil", status: "Confirm materials", stage: "Materials ready", due: "2026-08-22", dueLabel: "2 days", estimate: 4.5, logged: .5, remaining: 4, value: 245, paid: 245, progress: 12, next: "Engrave handwriting", blocker: "", color: "gray" },
];

/**
 * The single source of truth for build status, shared by the studio dashboard,
 * the shop-floor board and the customer-facing tracker. All three must agree or
 * a customer sees an empty timeline for a project that is nearly finished.
 */
export const projectStages: readonly string[] = ["Ordered", "Confirm materials", "Design", "Fabricate", "Package", "Ship", "Complete"];
