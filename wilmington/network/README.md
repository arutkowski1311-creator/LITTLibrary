# Northern Notch — network of homes

One file per property in `properties/`. `site/build.py` merges them into the site. Nothing here is
shown to guests until `status` is `live`; new submissions arrive as `pending-review`.

| Field | Meaning |
| --- | --- |
| `id`, `name`, `tagline`, `summary`, `town` | Identity and copy |
| `address.public` / `address.full` / `approximate` | Guests see town-level only until confirmed; the full address goes privately with arrival details |
| `location.lat` / `lng` / `approximate` | Map pin. Approximate pins draw as a circle, exact pins as a point |
| `permit` | Town STR permit number and status, county registration, insurance certificate. A property cannot go `live` without all three |
| `sleeps`, `bedrooms`, `bathrooms`, `units` | Facts. `units` lists sellable stays for network-booked properties |
| `amenities` | Keys from the amenity list in the onboarding form |
| `rates` | `base`, `weekend`, `cleaning`, `minStay`, `security`, `pets`; `mode` is `sample` until approved |
| `booking.mode` | `network-request` (our request flow; The Wild Pines only) or `external` (owner's own booking page, tracked link) |
| `calendar.ical` | iCal export URLs from the owner's booking system, used to show availability |
| `media` | Photo slot names (see `site/photos/README.md`) and an optional video URL |
| `responder` | Named local responder and backup (private) |
| `advertising` | `listed`, `co-op`, `co-op-plus`, or `network-owner` |
| `status` | `draft`, `pending-review`, `live`, `paused`, `retired` |

## Onboarding

Owners fill in `#/onboard` on the site. It produces a JSON submission they save or send; we drop it into
`submissions/`, review it against the launch gates (permit, insurance, photos with rights, honest facts,
responder), move it into `properties/` with `status: live`, and rebuild. Nothing is automatic between
submission and live.

## Commission

3% of completed accommodation revenue on stays that came through a property's tracked link, invoiced
monthly, cleaning and taxes excluded, refunds owe nothing. Northern Notch never takes guest payment for a
partner property and never holds its inventory. Details in `PARTNER_PROGRAM.md`.
