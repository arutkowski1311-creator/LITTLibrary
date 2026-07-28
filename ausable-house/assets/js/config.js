/* =============================================================================
   AUSABLE HOUSE — SITE CONFIGURATION
   -----------------------------------------------------------------------------
   This is the ONE file you (the owner) edit to run the site. No coding needed
   beyond changing the values below. Everything else reads from here.
   ============================================================================= */

window.SITE = {

  /* ---- Brand / contact ------------------------------------------------- */
  brand: {
    name: "Ausable House",
    tagline: "A Luxury Adirondack Escape in Wilmington, New York",
    location: "Wilmington, NY · Adirondack Park",
    url: "https://ausablehouse.com",          // your live domain (used for share links)
    ownerName: "Adam",
    email: "arutkowski1311@gmail.com",         // where booking requests + messages go
    phone: "+1 (000) 000-0000",                // <-- REPLACE with your number
    // For emergencies shown on the concierge itinerary:
    emergency: {
      addressLine: "0000 Route XX, Wilmington, NY 12997",   // <-- REPLACE exact address
      nearestHospital: "Adirondack Health – Lake Placid, 29 Church St, Lake Placid, NY",
      hospitalPhone: "(518) 523-3311",
      poison: "1-800-222-1222",
      nonEmergency: "Essex County Sheriff (non-emergency): (518) 873-6111"
    }
  },

  /* ---- Media ----------------------------------------------------------- */
  media: {
    // Drop your flyover video into assets/media/ and set the filename here.
    heroVideo: "assets/media/flyover.mp4",     // <-- ADD your video file
    heroPoster: "assets/media/hero-poster.jpg",// still frame shown before video loads
    // Gallery items: type "image" or "video". Add as many as you like.
    gallery: [
      { type: "image", src: "assets/media/gallery/great-room.jpg",  caption: "The great room at Ausable House", tags: ["main"] },
      { type: "image", src: "assets/media/gallery/kitchen.jpg",     caption: "Chef's kitchen",                  tags: ["main"] },
      { type: "image", src: "assets/media/gallery/primary.jpg",     caption: "Primary suite",                   tags: ["main"] },
      { type: "image", src: "assets/media/gallery/perch-living.jpg",caption: "The Perch — living space",        tags: ["perch"] },
      { type: "image", src: "assets/media/gallery/river.jpg",       caption: "Ausable River, minutes away",     tags: ["area"] },
      { type: "image", src: "assets/media/gallery/whiteface.jpg",   caption: "Whiteface Mountain",              tags: ["area"] },
      { type: "video", src: "assets/media/gallery/winter-tour.mp4", caption: "Winter walkthrough", poster: "assets/media/gallery/winter-poster.jpg", tags: ["main"] }
    ],
    // Curated images used for the shareable social card carousel:
    shareImages: [
      "assets/media/gallery/great-room.jpg",
      "assets/media/gallery/whiteface.jpg",
      "assets/media/gallery/river.jpg"
    ]
  },

  /* ---- Properties ------------------------------------------------------ */
  // turnoverDays = "cushion" days blocked AFTER each stay to clean/turn over.
  properties: [
    {
      id: "ausable-house",
      name: "Ausable House",
      subtitle: "The Main Home",
      beds: 4, baths: 2, sleeps: 10,
      turnoverDays: 1,
      minNights: 2,
      // Base nightly rate by season (USD). Weekend/holiday handled below.
      rates: { summer: 495, fall: 425, winter: 550, spring: 375 },
      cleaningFee: 175,
      petFee: 100,          // per stay, if pets allowed
      petsAllowed: true,
      description:
        "A spacious custom mountain home designed for gathering, relaxing, and " +
        "enjoying everything the Adirondacks have to offer. Four bedrooms, two baths, " +
        "and generous common space for families and groups.",
      features: ["Sleeps up to 10", "Chef's kitchen", "Wood-burning fireplace",
                 "Wooded, private setting", "Fast Wi-Fi", "Full laundry",
                 "Minutes to Whiteface & the Ausable River"],
      accessibility: "Ground-floor entry. Not fully wheelchair accessible — please inquire."
    },
    {
      id: "the-perch",
      name: "The Pinecone Perch",
      subtitle: "The Apartment",
      beds: 1, baths: 1, sleeps: 2,
      turnoverDays: 1,
      minNights: 2,
      rates: { summer: 195, fall: 175, winter: 225, spring: 155 },
      cleaningFee: 85,
      petFee: 75,
      petsAllowed: false,
      description:
        "A private second-floor apartment located above the garage, offering guests " +
        "a cozy and independent retreat of their own. Perfect for couples.",
      features: ["Sleeps 2", "Private entrance", "Kitchenette", "Independent retreat"],
      // IMPORTANT SAFETY / DISCLOSURE — surfaced prominently at booking:
      accessNote: "Access is via OUTDOOR STAIRS to a second-floor entrance. " +
                  "These stairs can be icy or snow-covered in winter. Not suitable " +
                  "for guests with mobility limitations. Not wheelchair accessible.",
      accessibility: "Second floor, reached by outdoor stairs. Not accessible."
    }
  ],
  // Allow renting both together at a bundled feel:
  bundleNote: "Ausable House and The Pinecone Perch can be rented together when " +
              "availability allows — ideal for larger groups who want to stay close " +
              "while keeping their own private space.",

  /* ---- Optional add-ons (gear / experiences) --------------------------- */
  addOns: [
    { id: "canoe",   name: "Canoe use",            price: 45,  unit: "per stay",  seasons:["summer","fall","spring"] },
    { id: "kayak",   name: "Kayak use (per kayak)",price: 35,  unit: "per stay",  seasons:["summer","fall","spring"] },
    { id: "firewood",name: "Bundle of firewood",   price: 25,  unit: "per bundle",seasons:["all"] },
    { id: "earlycheck", name: "Early check-in",    price: 50,  unit: "per stay",  seasons:["all"] },
    { id: "midclean",name: "Mid-stay cleaning",    price: 120, unit: "per visit", seasons:["all"] }
  ],

  /* ---- Rates rules ----------------------------------------------------- */
  ratesRules: {
    weekendMultiplier: 1.15,     // Fri/Sat nights
    holidayMultiplier: 1.35,     // dates listed below
    depositPercent: 0.50,        // NON-REFUNDABLE deposit taken at booking
    balanceDueDays: 7,           // balance (rest) due this many days before check-in
    cancelCutoffDays: 7,         // cancel > this many days out = balance refunded
    directDiscountPercent: 0.08, // "book direct" savings vs. platform pricing
    taxPercent: 0.13             // combined NY sales + Essex County occupancy (VERIFY!)
  },

  /* ---- Tax profile (used by the owner tax tracker: owner.html) ---------- */
  // VERIFY current rates with NY Dept. of Taxation & Finance + Essex County.
  tax: {
    nySalesTaxPercent: 0.08,       // NY state + local sales tax on the rental (VERIFY)
    essexOccupancyPercent: 0.05,   // Essex County occupancy ("bed") tax (VERIFY)
    filingFrequency: "quarterly",  // how often you remit — quarterly|monthly|annual
    // NY sales-tax quarters end: Feb, May, Aug, Nov; returns due ~20 days later.
    reminderNote: "NY sales-tax quarters end the last day of Feb/May/Aug/Nov; " +
                  "returns are generally due the 20th of the following month."
  },

  /* ---- Availability ---------------------------------------------------- */
  // Blocked date ranges (your own bookings / owner holds). Format: YYYY-MM-DD.
  // For Airbnb/VRBO sync, paste their exported iCal (.ics) URLs here — the
  // calendar will pull busy dates from them (see calendar.js notes on CORS).
  availability: {
    manualBlocks: {
      "ausable-house": [ /* { start:"2026-08-01", end:"2026-08-05" } */ ],
      "the-perch":     [ ]
    },
    icalFeeds: {
      "ausable-house": [ /* "https://www.airbnb.com/calendar/ical/XXXX.ics", "https://www.vrbo.com/icalendar/YYYY.ics" */ ],
      "the-perch":     [ ]
    }
  },

  /* ---- Local events (feeds the concierge + area guide) ----------------- */
  // Approx recurring/annual events. Update yearly. Used to flag "happening
  // during your stay" in the itinerary.
  events: [
    { name: "Whiteface ski season (lifts open)", start:"12-01", end:"04-15", tags:["winter","ski"] },
    { name: "Lake Placid Ironman (road closures likely)", start:"07-19", end:"07-21", tags:["summer","sport"] },
    { name: "Ausable River trophy trout season", start:"04-01", end:"10-15", tags:["fishing","spring","summer","fall"] },
    { name: "Peak fall foliage", start:"09-25", end:"10-15", tags:["fall","scenery"] },
    { name: "Whiteface Uphill / Climb to the Castle", start:"09-05", end:"09-07", tags:["fall","sport"] },
    { name: "Lake Placid Horse Shows", start:"06-24", end:"07-12", tags:["summer","equestrian"] }
  ],

  /* ---- Area guide (also used by concierge activity library) ------------ */
  areaGuide: [
    { name:"Whiteface Mountain", cat:"Ski & Ride", dist:"12 min",
      season:["winter"], interests:["ski","adventure","thrill"], forAges:["teens","adults","kids"],
      blurb:"Olympic mountain with the greatest vertical drop in the East. Skiing, riding, and the summertime gondola & Cloudsplitter." },
    { name:"Ausable River (West Branch)", cat:"Fishing & Water", dist:"5 min",
      season:["spring","summer","fall"], interests:["fishing","nature","relax"], forAges:["adults","teens"],
      blurb:"World-class trophy trout fly fishing right down the road. NY DEC license required." },
    { name:"High Falls Gorge", cat:"Sightseeing", dist:"8 min",
      season:["spring","summer","fall","winter"], interests:["nature","family","easy"], forAges:["kids","adults","seniors"],
      blurb:"Waterfalls and glass-floor trails over the gorge. Easy, stroller-friendly boardwalks." },
    { name:"Lake Placid Village & Olympic sites", cat:"Town & Culture", dist:"20 min",
      season:["spring","summer","fall","winter"], interests:["dining","shopping","history","family"], forAges:["all"],
      blurb:"Olympic ski jumps, bobsled, Mirror Lake, dining and shops. A full day out." },
    { name:"Cooper Kiln / Wilmington trails", cat:"Hiking", dist:"10 min",
      season:["spring","summer","fall"], interests:["hiking","adventure","nature"], forAges:["teens","adults"],
      blurb:"Backcountry hikes and quiet forest trails without the High Peaks crowds." },
    { name:"Hardy Road / Wilmington mountain biking", cat:"Biking", dist:"6 min",
      season:["summer","fall"], interests:["biking","adventure","thrill"], forAges:["teens","adults"],
      blurb:"Beginner-to-expert singletrack in the Wilmington trail network." },
    { name:"Monument Falls & Ausable swimming holes", cat:"Swimming", dist:"7 min",
      season:["summer"], interests:["swimming","relax","family","nature"], forAges:["kids","teens","adults"],
      blurb:"Classic riverside swimming spots and the iconic Whiteface reflection view." },
    { name:"Santa's Workshop / North Pole NY", cat:"Family", dist:"9 min",
      season:["summer","fall","winter"], interests:["family","kids"], forAges:["kids"],
      blurb:"A nostalgic Adirondack theme park — a hit with younger kids." },
    { name:"Whiteface Veterans' Memorial Highway", cat:"Scenic Drive", dist:"14 min",
      season:["summer","fall"], interests:["scenery","easy","family"], forAges:["all"],
      blurb:"Drive nearly to the summit; elevator through the rock to the top on clear days." }
  ],

  /* ---- Social share defaults ------------------------------------------ */
  share: {
    hashtags: ["#AusableHouse","#WilmingtonNY","#LakePlacid","#Adirondacks","#ADK",
               "#WhitefaceMountain","#AusableRiver","#PureADK","#MountainGetaway",
               "#AdirondackLife","#VisitAdirondacks","#ADKgetaway"],
    captionTemplate: "We're headed to {property} in the Adirondacks! {dates} of mountain air, " +
                     "Whiteface views, and {vibe}. Book your own escape 👇"
  },

  /* ---- Reviews / testimonials ------------------------------------------ */
  reviews: {
    // Your Google Business Profile links (create one at business.google.com):
    googleReadUrl:  "https://www.google.com/maps",          // <-- your Google reviews page
    googleWriteUrl: "https://g.page/r/YOUR_PLACE_ID/review", // <-- your "write a review" link
    // Seed testimonials here (replace with real ones as they come in):
    testimonials: [
      { name:"The Harrington Family", location:"Boston, MA", rating:5, stay:"Ausable House",
        text:"The most peaceful week we've had in years. The kids fished the Ausable every morning and we skied Whiteface twice. The house is stunning and the flyover video doesn't do it justice." },
      { name:"Marcus & Devin", location:"Brooklyn, NY", rating:5, stay:"The Pinecone Perch",
        text:"The perfect cozy hideaway for two. Coffee on the deck, a day in Lake Placid, and back to the fire. We're already planning our winter trip." },
      { name:"Sarah L.", location:"Montreal, QC", rating:5, stay:"Both properties",
        text:"We booked both for a family reunion — nine of us, everyone had their own space. The concierge itinerary they sent had us at High Falls Gorge and a swimming hole we'd never have found. Flawless." },
      { name:"Tom R.", location:"Albany, NY", rating:5, stay:"Ausable House",
        text:"Booked direct and saved a real chunk versus the apps. Communication was fast, the driveway warning was spot-on (bring the 4x4!), and the whole place felt like a true luxury retreat." }
    ]
  },

  /* ---- Social hashtag feed --------------------------------------------- */
  // TRUE hashtag auto-ingestion needs a service (Instagram Graph API or an
  // aggregator like EmbedSocial / Curator.io / Taggbox / Elfsight). Paste the
  // embed <script>/<div> from one of those into `aggregatorEmbed` to go live.
  // Until then, this shows a curated feed you control here.
  social: {
    hashtag: "#AusableHouse",
    instagram: "https://instagram.com/",   // <-- your IG profile
    aggregatorEmbed: null,                  // <-- paste live-feed embed HTML here later
    posts: [
      { img:"assets/media/gallery/whiteface.jpg", caption:"Bluebird day on Whiteface 🏔️ #AusableHouse", handle:"@guest_skier" },
      { img:"assets/media/gallery/river.jpg",     caption:"Morning on the Ausable 🎣 #AusableHouse", handle:"@flyfish_adk" },
      { img:"assets/media/gallery/great-room.jpg",caption:"Fireside after a long hike ✨ #AusableHouse", handle:"@thewanderinghs" },
      { img:"assets/media/gallery/perch-living.jpg",caption:"Our little Perch in the pines 🌲 #AusableHouse", handle:"@marcus.and.devin" }
    ]
  },

  /* ---- Digital house manual (shown on manual.html) --------------------- */
  // Share this page's link with confirmed guests. Fill in the blanks.
  houseManual: {
    wifiNetwork: "AusableHouse",
    wifiPassword: "___________",       // <-- set
    checkIn: "4:00 PM",
    checkOut: "10:00 AM",
    lockboxNote: "Door code is emailed the morning of arrival.",
    sections: [
      { title:"Arrival & Parking", icon:"🚗", items:[
        "Follow the driveway to the top and park in the gravel area by the garage.",
        "WINTER: the driveway is a steep, slick hill — a 4x4/AWD with good tires is strongly recommended. Go slow and keep momentum.",
        "The Pinecone Perch is up the outdoor stairs on the garage's second floor — use the handrail; steps can be icy."
      ]},
      { title:"Wi-Fi & Connectivity", icon:"📶", items:[
        "Network and password are at the top of this page.",
        "Cell service can be spotty in the mountains — Wi-Fi calling recommended."
      ]},
      { title:"Heat, Fireplace & Wood Stove", icon:"🔥", items:[
        "Thermostats are in the main hallway — please keep between 60–72°F.",
        "Wood-burning fireplace: open the flue fully before lighting; never leave a fire unattended; only dispose of ashes once completely cold.",
        "Firewood can be added to your booking; do not burn treated or painted wood."
      ]},
      { title:"Kitchen & Appliances", icon:"🍳", items:[
        "Dishwasher pods are under the sink — please run it before you leave.",
        "Coffee maker, basic spices, and cookware are provided.",
        "Recycling and trash instructions are below — this is bear country."
      ]},
      { title:"Trash, Recycling & Bears", icon:"🐻", items:[
        "NEVER leave food or trash outside — this is active bear country.",
        "Keep all doors and windows closed and locked when out.",
        "Bag trash and place it in the bear-resistant bin/garage as instructed; take it to the transfer station or leave for pickup per the note by the door."
      ]},
      { title:"Water & Septic", icon:"💧", items:[
        "The property is on a private well — the water is safe; conserve where you can.",
        "SEPTIC: flush only toilet paper. No wipes, paper towels, feminine products, grease, or chemicals."
      ]},
      { title:"Gear & Add-Ons", icon:"🛶", items:[
        "Canoe/kayak use can be added to your stay — life vests are required and provided.",
        "Use all gear at your own risk and follow posted safety guidance."
      ]},
      { title:"Check-Out", icon:"🔑", items:[
        "Start the dishwasher and bag the trash.",
        "Turn thermostats to 62°F (winter) / off (summer).",
        "Turn off lights, close and lock all windows and doors.",
        "Leave keys/fobs where you found them and pull the door shut."
      ]},
      { title:"Local Essentials", icon:"🧭", items:[
        "Nearest groceries & gas: Wilmington / Jay; larger stores in Lake Placid (~20 min).",
        "Firewood, bait, and licenses: local shops in Wilmington (NY DEC fishing license required).",
        "Urgent care & hospital details are on your concierge itinerary and below."
      ]}
    ]
  }
};
