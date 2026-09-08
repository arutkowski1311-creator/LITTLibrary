# Northern Notch — platform architecture (what the static preview shows vs. what production needs)

The published preview is a single static file. It renders every flow honestly, but four things need a
backend before real hosts and guests use them.

## 1. Host accounts and the gate
Guests must not see how hosting works. Production: an auth provider with email/password plus Google and
Apple sign-in — Supabase Auth is the simplest fit (Postgres, row-level security, hosted auth, both SSO
providers). Account requests (name, address, email, phone, username, password) land in a `host_requests`
table; Northern Notch approves, which creates the host role. Onboarding, pricing, the tax panel and the
partner economics live behind that role. Preview: `#/host` shows the sign-in and request forms; owner
tools unlock the host pages locally.

## 2. Payments and the fee that actually gets paid
A referral fee reported by hosts will not be paid reliably. Bookings placed on Northern Notch are
charged through **Stripe Connect** (Express accounts): the guest pays on our checkout, Stripe deducts the
3% application fee automatically and pays the balance to the host's connected account on the host's
schedule. Northern Notch never holds the money. Hosts still take bookings anywhere else and owe nothing on
them. Tax: because Northern Notch then facilitates the transaction, counsel and the tax adviser must
confirm the facilitator position under New York's 2025 short-term-rental sales-tax law; Stripe Tax can
compute and record the lines. An optional flat monthly platform fee (`config.platformFee`) covers hosting
if bookings are slow.

## 3. Calendars across many channels
Hosts use Airbnb, Vrbo, Booking.com and often a direct site at once. Each property carries a `channels`
list with a listing URL and an iCal export per channel. Production: a scheduled job merges every iCal into
a single blocked-dates set per property (and pushes our bookings back to the host's channel manager where
an API exists: OwnerRez, Lodgify, Hospitable, Hostaway). Until then the map and property pages show the
merged blocks as of the last sync time, and every quote revalidates before checkout (INV-04).

## 4. Maps
Production uses Google Maps JavaScript API with a domain-restricted key in `config.googleMapsKey`, plus
geocoding on onboarding to turn a street address into coordinates. The artifact sandbox blocks Google
scripts, so the preview falls back to the schematic map. Both are driven by the same property data.

## Pricing
`pricing.json` holds the rule set: seasons, event windows (recurring rules or fixed dates, each with a
verify flag and organiser URL), weekend uplift, per-unit floors, and a monthly market index that must come
from licensed comparable data (PriceLabs or equivalent) — never scraped from Airbnb (REV-03). Hosts see the
computed calendar with the reason for every night; changes above 15% from the last approved price are
flagged (REV-08). Guests see one nightly price.

## Taxes and fees (host-only)
`taxes.json` holds the rates and who each is remitted to. Hosts see the breakdown for any quote: gross,
cleaning, taxable base, each tax, processing, platform fee, net. Guests see a single "Taxes" line and the
total, which the FTC's 2025 unfair-fees rule requires before commitment (the spec's BOOK-01). Hosts may
build the cleaning fee into the nightly rate (`pricing.cleaningIncluded`); the guest then sees no cleaning line.
