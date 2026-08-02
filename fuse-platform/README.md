# Fuse Platform — real build

The youth-sports operating system. Fundraising is one module; the platform also
covers cameras/broadcast, org management, athlete tracking & development, and
coaching. This directory is the **real** application (Supabase + Stripe Connect +
Next.js) — distinct from the clickable prototypes in `../baseball-tracker/`.

## Locked decisions

| Fork | Decision |
|---|---|
| Payments/liability | **Facilitator** — orgs are Stripe **Connect** accounts; the platform never holds fundraising funds. |
| Monetization | **Layered subscriptions** — orgs subscribe (module bundles); parents/viewers subscribe (streaming, reports, clips). Connect facilitation rides on money-in-motion. |
| First wedge | **Golf, end-to-end** — deposit → 21-day go/no-go → guaranteed count → settlement → reconciled payout. |
| Stack | **Supabase (Postgres + RLS)** · **Stripe Connect + Billing** · **Next.js**. |

## Two payment rails (do not mix them)

1. **Connect rail — money to the ORG.** Fundraising, store, tickets, auctions.
   Flows into the org's connected account; the platform takes a thin facilitation
   fee. Recorded in `order` → `ledger_entry`. This is the auditable fundraising
   ledger.
2. **Billing rail — money to the PLATFORM.** Org and consumer subscriptions via
   Stripe Billing. Recorded in `subscription` → `billing_invoice`. Never touches
   the Connect ledger.

## The spine (migration `0001_spine.sql`)

- **Tenancy & RBAC** — `organization` (tenant root), `app_user` (mirrors Supabase
  Auth), `team`, `membership` (role scoped to org, optionally one team, with
  expiry for delegated volunteer access).
- **Subscription & entitlement** — `plan` (org or consumer audience), `subscription`
  (exactly one subject), `entitlement` (flattened runtime grant every module
  checks). This is what the pricing model forced into the foundation.
- **Commerce spine** — `campaign` / `event` / `package` / `order` / `order_item`,
  shared by every money-in-motion module. `supporter` and `sponsor` (CRM seed).
- **Ledger** — `ledger_entry`, append-only, grouped by `txn_group`, each group of
  paired allocations sums to zero. The crown jewel; everything reconciles here.
- **Golf** — `golf_course` / `golf_package` / `golf_availability` (partner side),
  `golf_outing` / `golf_registration` / `golf_task` (org side, with the 21-day
  and guaranteed-count commercial workflow).
- **Audit** — `audit_log`, immutable, for financial/permission/draw actions.

### RLS isolation

One rule carries most of the multi-tenancy: **you may touch a row only if you
hold a live membership in that row's org** (`is_org_member()`). Ledger and audit
are read + insert only — never update/delete. Platform-admin bypass, public-read
for published campaigns/course listings, and consumer self-access come in `0002`.

## Next migrations / build order

- **0002** — Stripe webhook handlers, subscription→entitlement sync, public-read
  policies, platform-admin bypass, consumer self-access.
- **0003** — ledger posting functions (order paid → balanced entries; refund;
  payout; facilitation fee) with a `txn_group` balance assertion.
- **App** — Next.js: org onboarding (§5), golf event builder (§6.3), course
  partner portal (§6.2), checkout on Connect, settlement statement.

## Run it locally (no cloud accounts)

Prereqs: Docker + Node 18+.

```bash
cp .env.example .env.local          # local-only connection strings
docker compose up -d                # local Postgres 16 on :5432
npm install
npm run db:reset                    # reset + apply all migrations + seed
npm run dev                         # http://localhost:3000
```

`npm run db:reset` is reproducible — it drops and rebuilds the schema, applies
`db/00_stubs.sql` (the local shim for Supabase's `auth.*`), every migration in
`supabase/migrations`, the RLS-enforced `fuse_app` role, and `db/seed.sql`.

The header persona switcher (Adam = Org Owner, Jason = Team Manager) sets a
cookie that scopes every query through RLS. The golf page's Register/Sell
buttons run the **FakeStripe** adapter and post real balanced entries to the
ledger — the dashboard and settlement recompute from `org_ledger_summary`.

### Going live later (the swap)

Nothing about the schema or business logic changes:
- Point `DATABASE_URL` at a Supabase project (the migrations are already
  Supabase-flavored; drop `db/00_stubs.sql`, which only shims local Postgres).
- Replace `FakeStripe` in `lib/payments.ts` with a Stripe Connect adapter; the
  webhook handler calls the same `record_payment` / `record_refund` functions.
- Swap `lib/auth.ts` for Supabase Auth.

## First proof of life

One real golf outing: create from a course package → take a deposit → confirm
go/no-go at 21 days → lock the guaranteed count → run settlement → reconcile the
payout against `ledger_entry`. When that balances, raffle/auction/store are
mostly reuse of `campaign`/`order`/`ledger`.
