# Ausable House — Luxury Adirondack Rental Site

A mobile-first, luxury Adirondack direct-booking website for **Ausable House** (4BR/2BA main
home) and **The Pinecone Perch** (1BR/1BA apartment) in Wilmington, NY.

Everything here is **static** — it runs on any web host (GitHub Pages, Netlify, Cloudflare
Pages, Vercel) with no server required for Phase 1. You edit one file (`assets/js/config.js`)
to run the whole site.

---

## Quick start

1. **Open `index.html`** in a browser to preview locally (or run `python3 -m http.server` in
   this folder and visit `http://localhost:8000`).
2. **Edit `assets/js/config.js`** — your contact info, address, rates, add-ons, area guide,
   events, and calendar feeds all live here. It's commented throughout.
3. **Add your media** to `assets/media/` (see that folder's README). At minimum: `flyover.mp4`
   and `hero-poster.jpg`.
4. **Deploy** to any static host. For a custom domain (e.g. `ausablehouse.com`), point DNS at
   your host and enable HTTPS.

---

## What's built (Phase 1 — live now)

| Feature | Status | Notes |
|---|---|---|
| Luxury Adirondack design, mobile-first | ✅ | Video hero, warm palette, serif display |
| Video flyover background | ✅ | Add `flyover.mp4`; graceful gradient fallback |
| Photo + video gallery w/ filters + lightbox | ✅ | Configure in `config.js` |
| Two properties (Ausable House + The Pinecone Perch) | ✅ | Beds/baths/rates/access notes |
| Date-picker booking calendar | ✅ | Range select, min-nights, live seasonal pricing |
| **Turnover / cushion time** between stays | ✅ | `turnoverDays` per property auto-blocks days |
| Booking request (no backend) | ✅ | Composes an email to you; add Stripe for real payments |
| Direct-booking disclosures (no AirCover, non-refundable deposit) | ✅ | Enforced checkboxes + full terms |
| Cold/ice/snow + 4×4 driveway + outdoor-stairs waivers | ✅ | In-page modals; **have a lawyer review** |
| **Cancellation policy** (50% deposit / balance at 7 days / cutoff) | ✅ | Shown live in booking summary + full terms |
| Area guide | ✅ | Editable list of local activities |
| **Concierge**: optional survey → tailored itinerary → **PDF** | ✅ | Season/age/interest matching + events + emergency info |
| **Guest testimonials** + **Google reviews** link/button | ✅ | Seed in `config.js`; links to your Google Business Profile |
| **Social hashtag feed** | ✅ (curated) | Config-driven now; paste an aggregator embed to go live (see below) |
| **Digital house manual** (`manual.html`) | ✅ | Private page: wifi, appliances, bear/septic rules, checkout, emergency. Printable |
| **Owner tax tracker** (`owner.html`) | ✅ | Computes NY sales + Essex occupancy tax per booking, quarterly totals, filing-deadline reminders + `.ics` |
| Optional add-ons (canoe, kayak, firewood, etc.) | ✅ | Priced into the booking summary |
| Social share: story image + caption + hashtags + link | ✅ | Canvas image, one-tap download & copy |
| Messaging / contact form | ✅ | Email-based (see Phase 2 for live chat) |
| Calendar **read** from Airbnb/Vrbo iCal | ✅ (best-effort) | One-way; blocks their bookings on yours |
| SEO basics (title, OG tags, structured data) | ✅ | Add Google Business Profile too |

### Making the social feed live
The feed shows curated posts from `config.js` by default. For **true hashtag auto-ingestion**,
sign up for an aggregator (EmbedSocial, Curator.io, Taggbox, or Elfsight — most have a free tier),
create a feed for `#AusableHouse`, and paste their embed snippet into `social.aggregatorEmbed`
in `config.js`. Instagram's own API (Graph API) also works but requires a Business account and
app review. Note: no purely client-side site can scrape Instagram directly — a service is required.

---

## What needs a backend or a service (Phase 2 — decisions for you)

These genuinely can't be done well with a static site. Pick a path and I can wire it up:

1. **Online payments + real reservations.** Add **Stripe** (Payment Links or Checkout) to take
   the non-refundable deposit and balance. Needs a tiny serverless function (Netlify/Cloudflare
   Functions) or a no-code Stripe Payment Link per booking.
2. **True two-way calendar sync + channel manager.** You said this is a must — and it's the one
   thing that genuinely *cannot* be done from a static site, because syncing a booking back into
   Airbnb/Vrbo requires writing to their systems through an authenticated server. The standard,
   reliable way to do this is a **channel manager**: **Hospitable, OwnerRez, Lodgify, or Hostaway**.
   They keep Airbnb + Vrbo + your direct calendar in perfect sync, give you one inbox, and handle
   payments. Recommended path: pick one (I'd start with **Hospitable** or **OwnerRez** for two
   units), then either embed their direct-booking widget into this site or let me wire the site's
   booking form to their API. Phase-1 iCal read here is one-way (their bookings block yours) and is
   a fine stopgap until you choose a manager.
3. **Live guest messaging / inbox.** Phase 1 uses email. For threaded chat, use the channel
   manager's inbox, or add a form-to-database + notifications.
4. **AI-powered concierge.** The itinerary engine is rule-based and ready for you to extend.
   To add real AI suggestions (Claude API), we route the survey through a serverless function
   that calls the model and merges results into the PDF — keeps your API key off the client.

---

## File map

```
ausable-house/
├─ index.html              # the whole site (single page)
├─ manual.html             # private digital house manual (share link with guests)
├─ owner.html              # private owner tax tracker (stays in your browser)
├─ assets/
│  ├─ css/site.css         # design system
│  ├─ js/
│  │  ├─ config.js         # ← YOU EDIT THIS (all content & settings)
│  │  ├─ legal.js          # waiver / rules / terms / privacy (lawyer review!)
│  │  ├─ main.js           # nav, hero, gallery, area guide, modals
│  │  ├─ calendar.js       # availability model + iCal + turnover buffers
│  │  ├─ booking.js        # date picker, pricing, request submit
│  │  ├─ concierge.js      # survey → itinerary → PDF
│  │  └─ share.js          # social story image + caption + hashtags
│  └─ media/               # ← YOUR photos & video go here
```

---

## ⚠️ Before you go live — legal & compliance checklist

The waivers in `legal.js` are **starter templates, not legal advice**. Also handle:

- [x] **LLC formed** — ✅ done. Put the entity's legal name into `legal.js` (the `co` variable).
- [ ] **Short-term-rental permit / registration** — check Town of Wilmington & Essex County rules.
- [ ] **Register for NY sales tax + Essex County occupancy tax** — then track what you owe each
      quarter in `owner.html` (verify the rates in `config.js` → `tax`).
- [ ] **Commercial STR / landlord liability insurance** — (you're looking into this 👍). Your guest
      disclaimers don't replace *your* coverage — get an STR-specific policy (Proper, Safely, CBIZ).
- [ ] **Have a NY attorney review** the waiver, agreement, and cancellation terms.
- [ ] **CO & smoke detectors** installed per NY law; document it.
- [x] **Septic, well, wood-stove, bear-country** rules communicated — House Rules + house manual.
- [x] **Accessibility disclosure** — The Perch (stairs) not accessible; stated on card + waiver.
