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
| Area guide | ✅ | Editable list of local activities |
| **Concierge**: optional survey → tailored itinerary → **PDF** | ✅ | Season/age/interest matching + events + emergency info |
| Optional add-ons (canoe, kayak, firewood, etc.) | ✅ | Priced into the booking summary |
| Social share: story image + caption + hashtags + link | ✅ | Canvas image, one-tap download & copy |
| Messaging / contact form | ✅ | Email-based (see Phase 2 for live chat) |
| Calendar **read** from Airbnb/Vrbo iCal | ✅ (best-effort) | One-way; blocks their bookings on yours |
| SEO basics (title, OG tags, structured data) | ✅ | Add Google Business Profile too |

---

## What needs a backend or a service (Phase 2 — decisions for you)

These genuinely can't be done well with a static site. Pick a path and I can wire it up:

1. **Online payments + real reservations.** Add **Stripe** (Payment Links or Checkout) to take
   the non-refundable deposit and balance. Needs a tiny serverless function (Netlify/Cloudflare
   Functions) or a no-code Stripe Payment Link per booking.
2. **True two-way calendar sync + channel manager.** So a direct booking instantly blocks
   Airbnb/Vrbo and vice-versa, with one inbox and automated messaging. Best handled by a
   purpose-built tool — **Hospitable, OwnerRez, Lodgify, or Hostaway**. The site can embed their
   booking widget, or I can sync via their API. (Phase-1 iCal read is one-way only.)
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

- [ ] **Short-term-rental permit / registration** — check Town of Wilmington & Essex County rules.
- [ ] **Occupancy / bed tax + NY sales tax** — register and remit (rate placeholder in `config.js`).
- [ ] **Commercial STR / landlord liability insurance** — your disclaimers don't replace your own
      coverage. Look at STR-specific policies (e.g. Proper, Safely, CBIZ).
- [ ] **Have a NY attorney review** the waiver, agreement, and cancellation terms.
- [ ] **Form an LLC** and put the property/bookings under it; update the entity name in `legal.js`.
- [ ] **CO & smoke detectors** installed per NY law; document it.
- [ ] **Septic, well, wood-stove, bear-country** rules communicated (already in House Rules).
- [ ] **Accessibility disclosure** — The Perch (stairs) is not accessible; state it (done in-site).
