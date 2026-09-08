# Whiteface-region network — partner program (working draft)

The guest site, booking flow and concierge engine were built for Ausable House. This note sets out
how to open them to a small number of other local rentals at a 3% fee, and an optional pooled
advertising package. Numbers marked *proposed* are starting points, not decisions.

## 1. The model: referral network, not marketplace

| | Referral network (recommended first) | Marketplace |
| --- | --- | --- |
| Who takes the guest's money | The partner's own booking system (OwnerRez, Lodgify, channel manager) | Us, as merchant of record |
| Who holds the calendar | The partner. One operational authority per property (ARC-01) | Us, with sync risk across every partner's channels |
| Tax position | Partner remains the operator; we sell a listing/referral service | NY treats a booking platform that collects payment as a facilitator with its own sales-tax and occupancy-tax duties (COM-02) |
| Licensing exposure | Partner must hold the town STR permit and county registration; we list only permitted units | Same, plus platform-level scrutiny |
| Guest contract, deposit, damage | Partner's agreement, partner's processor | Ours — one contract across houses we don't control |
| Build cost | Small: a tracked link per property, an invoice each month | Large: payments, payouts, refunds, chargebacks, 1099s |

Start as a referral network. Revisit a marketplace only if partners ask us to run their bookings
outright, and only with counsel, an insurer and a processor lined up.

## 2. The 3% fee

- **Basis:** 3% of the accommodation total on completed stays that came through the network link.
  Excludes cleaning fees, taxes, security deposits and add-ons. Cancelled or refunded stays owe nothing.
- **Attribution:** each property gets a unique tracked link (UTM plus a short code in the URL). Partners
  send a monthly list of completed stays with source; we reconcile against our click and date-search
  log (ANA-01) and invoice the difference conversationally, not adversarially. Most managers can tag
  a booking source; OwnerRez and Lodgify both record referrer.
- **What it buys:** hosting, the concierge library and its monthly vetting, photography standards,
  the booking-flow UX, and reporting. It is priced to cover cost, so say so; that is the pitch.
- **Worked example:** a partner doing $60,000 a year in direct accommodation revenue through the
  network pays $1,800. The same $60,000 on Airbnb host-only pricing costs roughly $9,000 (verify the
  partner's real rate) and the guest relationship belongs to Airbnb.
- **Terms to put in the one-page agreement (counsel):** non-exclusive; either side can end with 30
  days' notice; partner warrants permit, registration, insurance and accurate facts; we may delist
  for inaccurate listings or unresolved guest complaints; fee invoiced monthly, net 15; no fee on
  repeat guests who book direct with the partner after their first network stay (optional goodwill
  clause that makes the deal feel fair).

## 3. Pooled advertising (opt-in)

| Tier | Price (proposed) | What it buys |
| --- | --- | --- |
| Listed | $0 | Network page, concierge guide for their guests, seasonal email mention |
| Co-op | $150 / month | Share of a single regional Google + Meta campaign landing on the network compare page; monthly report of clicks, date searches and bookings with the partner's share |
| Co-op Plus | $350 / month | Co-op plus a featured home-page slot in rotation, a seasonal push for their open dates, half-day photography at cost |

Rules that keep it fair: budget is spent as one campaign, never split into micro-campaigns; the
landing page shows every network property with availability for the searched dates (MKT-02:
an ad never sends a guest to a sold-out house); reporting is shared, not private; anyone can pause
monthly. Set the tier prices after one quarter of real campaign spend, not before.

## 4. What makes it make sense for a local owner

1. **Money they keep.** 3% versus 8–20%. Lead with the annual number in their own revenue.
2. **Nothing to maintain.** The concierge engine and its vetting are the part no single owner will
   ever keep current alone. Their guests get a better arrival guide than they could write.
3. **Their calendar, their money, their contract.** No new system, no held funds, no double bookings
   from a second inventory.
4. **A standard they can point to.** Honest facts, real photos, shared-space disclosure. Guests trust
   the network because every house is held to it.
5. **Ads that finally reach scale.** Five houses can afford a campaign; one cannot.
6. **Local.** Run by a neighbour who answers the phone, not a platform.

## 5. What we require before a listing goes live

Town STR permit and county registration on file; STR insurance certificate; real, current photographs
with rights recorded; verified beds, baths, occupancy, parking and shared spaces; a named local
responder; a working booking link. The same launch gates we hold ourselves to (§06 of the spec).

## 6. Site and data changes to support it

- `properties.json`: one record per property (brand, units, facts, photos, booking link, tracked
  code, partner tier, status) driving a network compare page and per-property pages.
- Booking: network properties route to the partner's own booking page with the tracked code; only
  Ausable House uses the on-site request flow.
- Umbrella brand and domain for the network page, with each property keeping its own name.
- Attribution log: clicks, date searches and outbound booking clicks per property (ANA-01).
- Partner dashboard (later): their page's traffic, their share of campaign results, their invoice.

## 7. Open decisions

Umbrella brand and domain · the legal entity that invoices partners · counsel review of the
agreement and of the referral-vs-facilitator position · insurer sign-off on listing third-party
homes · whether repeat-guest bookings are fee-free · tier prices after first campaign data.
