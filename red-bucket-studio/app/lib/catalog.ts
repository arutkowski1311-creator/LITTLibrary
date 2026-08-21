export type CatalogProduct = {
  id?: number;
  slug: string;
  name: string;
  category: string;
  detail: string;
  price: number;
  inventory: number;
  leadTimeDays: number;
  materials: string;
  options: string[];
  image: string;
  alt: string;
  badge: string;
  active?: boolean;
};

export type WorkStory = {
  title: string;
  kicker: string;
  materials: string;
  image: string;
  alt: string;
  /** Intrinsic pixels, so every layout can reserve space before the file lands. */
  width: number;
  height: number;
  /** Long-form description used on the Custom Builds page. */
  story: string;
};

export const featuredWork: WorkStory[] = [
  {
    title: "The traveling bar",
    kicker: "Actual Red Bucket build",
    materials: "Vintage tool case · oak · cocktail set",
    image: "/assets/toolbox-bourbon-bar.webp",
    alt: "Vintage toolbox transformed into a bourbon and cocktail bar",
    width: 598,
    height: 785,
    story:
      "A battered military tool case rebuilt as a self-contained bourbon and cocktail bar, complete with fitted glassware, tools and a little swagger.",
  },
  {
    title: "Old light, new life",
    kicker: "Upcycled lighting",
    materials: "Antique lanterns · reclaimed timber · steel",
    image: "/assets/antique-chandelier-light.webp",
    alt: "Antique lanterns transformed into a custom chandelier",
    width: 623,
    height: 781,
    story:
      "Antique lanterns preserved instead of replaced, then recast as a dramatic timber-and-steel chandelier with modern wiring.",
  },
  {
    title: "The wing, grounded",
    kicker: "Aviation salvage",
    materials: "Aircraft wing · glass · steel",
    image: "/assets/airplane-wing-table.webp",
    alt: "Aircraft wing transformed into a glass-top conference table",
    width: 537,
    height: 372,
    story:
      "An aircraft wing becomes the structure of a glass-topped table. The original engineering stays visible because that is the entire point.",
  },
  {
    title: "Built for the display",
    kicker: "Custom retail fixture",
    materials: "Maple · CNC-cut product wells",
    image: "/assets/custom-store-display.webp",
    alt: "Custom wood store display built for small products",
    width: 514,
    height: 773,
    story:
      "A clean, exact retail fixture designed around the products it needs to carry, from CNC-cut wells to the brand detail.",
  },
];

export const allProducts: CatalogProduct[] = [
  { slug: "bourbon-heritage-chest", name: "Bourbon Heritage Chest", category: "Bar & drink", detail: "An old-world presentation chest built around a favorite bottle and the story behind it", price: 325, inventory: 8, leadTimeDays: 14, materials: "Distressed wood chest · fitted hardwood insert · aged hardware", options: ["Bottle and glass layout", "Family name or monogram", "Interior inscription", "Wood tone"], image: "/assets/toolbox-bourbon-bar.webp", alt: "Vintage chest arranged as a bourbon bar", badge: "Signature gift" },
  { slug: "whiskey-flight-set", name: "Whiskey Flight Set", category: "Bar & drink", detail: "Four-glass tasting flight with engraved labels, notes or distillery theme", price: 145, inventory: 14, leadTimeDays: 8, materials: "Hardwood flight board · tasting glasses", options: ["Wood species", "Glass count", "Engraving", "Gift message"], image: "/assets/charcuterie-board.webp", alt: "Engraved hardwood presentation board", badge: "Gift-ready" },
  { slug: "shotski", name: "Four-Person Shotski", category: "Bar & drink", detail: "Vintage ski, four glasses, school colors and custom engraving", price: 225, inventory: 12, leadTimeDays: 10, materials: "Vintage ski · four glass holders · engraved hardwood", options: ["College or custom theme", "Colors and crest", "Names or date", "Standard, priority or rush"], image: "/assets/ski-display.webp", alt: "Vintage ski transformed into a custom four-person shotski", badge: "College favorite" },
  { slug: "beer-caddy", name: "Beer Caddy", category: "Bar & drink", detail: "A personalized six-bottle carrier with opener and removable divider", price: 115, inventory: 16, leadTimeDays: 8, materials: "Hardwood carrier · forged opener · aged hardware", options: ["Six-pack or bomber layout", "Name or logo", "Finish", "Cap catcher"], image: "/assets/custom-store-display.webp", alt: "Custom wood carrier and display", badge: "Easy favorite" },
  { slug: "opener-cap-catcher", name: "Bottle Opener and Cap Catcher", category: "Bar & drink", detail: "Wall-mounted opener with a personalized catch box below", price: 85, inventory: 20, leadTimeDays: 6, materials: "Hardwood backer · cast opener · catch box", options: ["Name, team or logo", "Wood finish", "Opener finish"], image: "/assets/house-sign.webp", alt: "Personalized wood wall piece", badge: "Fast gift" },
  { slug: "coaster-gift-set", name: "Six-Coaster Gift Set", category: "Heritage gifts", detail: "Six substantial coasters in a fitted holder with names, maps or marks", price: 78, inventory: 24, leadTimeDays: 6, materials: "Hardwood, slate or leather · fitted holder", options: ["Material", "Set design", "Monogram or logo", "Gift box"], image: "/assets/charcuterie-board.webp", alt: "Custom engraved hardwood gift set", badge: "Under $100" },
  { slug: "family-legacy-box", name: "Family Legacy Box", category: "Heritage gifts", detail: "A keepsake chest for letters, photographs and the things a family cannot replace", price: 195, inventory: 10, leadTimeDays: 12, materials: "Solid wood box · aged hardware · lined interior", options: ["Family name", "Interior message", "Compartments", "Wood and finish"], image: "/assets/toolbox-bourbon-bar.webp", alt: "Vintage-style keepsake chest with fitted interior", badge: "Heirloom" },
  { slug: "mens-valet-box", name: "Men’s Valet Box", category: "Heritage gifts", detail: "A clean landing place for a watch, wallet, keys and everyday carry", price: 165, inventory: 12, leadTimeDays: 10, materials: "Hardwood box · leather or felt lining · aged hardware", options: ["Tray layout", "Watch slots", "Monogram", "Lining color"], image: "/assets/toolbox-bourbon-bar.webp", alt: "Custom fitted wood chest", badge: "Personalized" },
  { slug: "closing-day-frame", name: "Closing-Day Frame", category: "Home & milestones", detail: "A realtor-ready gift for the house photo, address and closing date", price: 125, inventory: 20, leadTimeDays: 7, materials: "Hardwood frame · engraved address plate", options: ["Photo size", "Address and date", "Realtor branding", "Wood finish"], image: "/assets/house-sign.webp", alt: "Custom engraved home and address piece", badge: "Realtor gift" },
  { slug: "golf-scorecard-shadow-box", name: "Golf Scorecard Shadow Box", category: "Golf & outdoor", detail: "Preserve the scorecard, ball and photograph from the round that mattered", price: 185, inventory: 10, leadTimeDays: 12, materials: "Hardwood frame · glass · fitted display mounts", options: ["Scorecard size", "Ball or tee display", "Course name", "Plaque engraving"], image: "/assets/military-plaque.webp", alt: "Custom shadow box and commemorative display", badge: "Memory keeper" },
  { slug: "grilling-set", name: "Personalized Grilling Set", category: "Golf & outdoor", detail: "Engraved tools and a purpose-built case for the person who owns the grill", price: 155, inventory: 14, leadTimeDays: 9, materials: "Stainless tools · fitted wood case", options: ["Tool count", "Name or title", "Case message", "Finish"], image: "/assets/charcuterie-board.webp", alt: "Personalized hardwood presentation set", badge: "Host gift" },
  { slug: "time-capsule-box", name: "Wedding or New-Home Time-Capsule Box", category: "Home & milestones", detail: "A sealed-now, open-later box for vows, letters, photos and first-home memories", price: 225, inventory: 10, leadTimeDays: 12, materials: "Solid wood chest · aged hardware · interior dividers", options: ["Wedding or new-home edition", "Open-on date", "Names and coordinates", "Interior compartments"], image: "/assets/toolbox-bourbon-bar.webp", alt: "Vintage-style personalized memory chest", badge: "Milestone gift" },
];

export const featuredProducts = allProducts.slice(0, 4);

export const shotskiColleges = [
  "University of Colorado", "University of Vermont", "University of Utah", "University of Denver",
  "Montana State University", "University of New Hampshire", "University of Maine", "Dartmouth College",
  "Middlebury College", "Custom college or mountain",
];
