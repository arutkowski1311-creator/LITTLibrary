# Red Bucket Design Co

The website and studio operations app for Red Bucket Design Co — a custom
fabrication studio in Bridgewater, New Jersey that turns vintage objects, raw
materials and salvage into one-of-one furniture, lighting, signs, gifts and
commercial fixtures.

It is one application with two audiences: a public storefront for customers, and
a set of sign-in-only surfaces for running the shop.

## What is in here

### Public

| Route | What it does |
| --- | --- |
| `/` | Landing page: the three ways into the workshop, featured builds, current collections |
| `/shop` | Catalog and product customizer — options, finish, delivery speed, live price and bag |
| `/gift-finder` | Four-question commission brief that ends in a request for an idea meeting |
| `/second-act` | Photo upload for an object the customer wants transformed |
| `/commercial` | Commercial fabrication: signage, bars, displays, fixtures |
| `/work` | Long-form record of past builds |
| `/track` | Customer build tracking by project code + email |

### Studio only (ChatGPT sign-in required)

| Route | What it does |
| --- | --- |
| `/ops` | Production, capacity, customers, catalog, payments and incoming ideas |
| `/shopboard` | Full-screen shop-floor board, styled as an instrument panel for wall display |

### API

`/api/*` routes back the surfaces above. `inquiries`, `second-act`, `subscribers`
and `track` are public (customers submit to them); `projects`, `catalog`,
`payments`, `communications`, `design-briefs` and `idea-image` require a signed-in
studio user via `app/chatgpt-auth.ts`.

## Stack

- **[vinext](https://github.com/cloudflare/vinext)** — Next.js App Router semantics on Vite, deployed as a Cloudflare Worker
- **React 19** server and client components
- **Cloudflare D1** + **Drizzle ORM** for projects, customers, catalog, inquiries
- **Cloudflare R2** for Second Act photo uploads
- **Plain CSS** in `app/globals.css`, built on custom properties — no CSS framework

Bindings are declared in `.openai/hosting.json` (`DB` for D1, `BUCKET` for R2)
and simulated locally by `vite.config.ts`. Every page that reads the database
falls back to seed data in `app/lib/`, so the site renders before D1 is
provisioned.

## Running it

Requires Node `>=22.13.0` on Linux (the helper scripts use GNU `timeout` and
`flock`).

```bash
npm install
npm run dev          # Vite + Miniflare dev server
npm run build        # build the deployable Sites artifact into dist/
npm run start        # serve the built app
npm run lint         # ESLint
npm run db:generate  # regenerate Drizzle migrations after editing db/schema.ts
```

`npm test` builds and then imports the built worker in plain Node to check the
rendered HTML. Node cannot resolve the `cloudflare:workers` module the database
layer imports, so it fails outside the Workers runtime — this is true of the
project as originally written, not a regression. `npm run build` is the
meaningful gate, and CI runs lint + build.

## Configuration

| Variable | Purpose |
| --- | --- |
| `SITE_URL` | Canonical origin for metadata, `sitemap.xml`, `robots.txt` and structured data. Set this when the site moves to its own domain; it otherwise defaults to the current hosted URL. |

## Where things live

```
app/
  page.tsx              landing page
  layout.tsx            document shell, metadata, favicons
  globals.css           the entire stylesheet, tokens first
  components/           header, footer, bag store, newsletter, share, JSON-LD
  lib/catalog.ts        products and featured builds
  lib/ops-data.ts       seed projects and the canonical build-stage list
  lib/site.ts           canonical URL and studio details
  api/                  route handlers
db/                     Drizzle schema and the D1 client
drizzle/                generated migrations
worker/index.ts         Cloudflare Worker entry, image optimization endpoint
public/assets/          photography (WebP) and brand marks
```

## Three conventions worth knowing

**Build stages are defined once.** `projectStages` in `app/lib/ops-data.ts` is the
single list shared by the ops dashboard, the shop-floor board and the customer
tracker. They have to agree — when they drifted apart, a customer saw an empty
progress timeline for a build that was nearly finished.

**Type never goes below the floor.** `--micro`, `--tiny` and `--small` in
`app/globals.css` are the three smallest sizes used on the customer-facing site.
Reach for those tokens instead of hard-coding a pixel size, so label text stays
readable on a phone. The shop-floor board (`.cockpit-*`) is deliberately exempt:
it is a fixed-width wall display with its own instrument-panel styling.

**Images are hand-tuned, not framework-optimized.** `next/image` is not used
because the Worker's image-optimization endpoint needs an `IMAGES` binding that
`.openai/hosting.json` does not declare. Photography is pre-compressed WebP with
explicit dimensions, `loading="lazy"` below the fold and a `srcset` on the hero.
If an `IMAGES` binding is added later, moving to `next/image` is a worthwhile
follow-up.
