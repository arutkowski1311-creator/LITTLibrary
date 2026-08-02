'use server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { AUTH_COOKIE, currentUid } from '@/lib/auth'
import { withUser } from '@/lib/db'
import { payments } from '@/lib/payments'

/** Dev persona switch. */
export async function setUser(formData: FormData) {
  const uid = String(formData.get('uid') || '')
  cookies().set(AUTH_COOKIE, uid, { path: '/' })
  revalidatePath('/', 'layout')
}

/**
 * Onboard a new organization (§5). One atomic security-definer call creates the
 * org, the owner membership, and the module-entitlement plan+subscription — so
 * a brand-new user lands in a working, entitled org. Then redirect to it.
 */
export async function createOrg(formData: FormData) {
  const uid = currentUid()
  const modules = formData.getAll('modules').map(String)
  const goalDollars = parseFloat(String(formData.get('goal'))) || 0

  await withUser(uid, (c) =>
    c.query('select create_organization($1,$2,$3,$4,$5,$6,$7,$8,$9)', [
      String(formData.get('public_name') || 'New Org'),
      String(formData.get('legal_name') || ''),
      String(formData.get('entity_type') || 'nonprofit_501c3'),
      String(formData.get('jurisdiction') || 'US-NJ'),
      String(formData.get('brand_primary') || '#F6A93B'),
      String(formData.get('brand_accent') || '#FF6A2B'),
      Math.round(goalDollars * 100),
      formData.get('connect') === 'on',
      modules,
    ]),
  )

  revalidatePath('/', 'layout')
  redirect('/')
}

/**
 * Buy a golf package (foursome / sponsorship / etc). Creates the order + item
 * (inventory and exclusivity guards fire in the DB), then runs the fake charge
 * and record_payment — which mirrors the payment and posts the balanced ledger
 * entries. One transaction, so a guard rejection rolls the whole thing back.
 */
export async function purchasePackage(formData: FormData) {
  const uid = currentUid()
  const packageId = String(formData.get('packageId'))
  const supporterId = String(formData.get('supporterId'))

  await withUser(uid, async (c) => {
    const pkg = (await c.query('select org_id, price_cents from package where id=$1', [packageId])).rows[0]
    if (!pkg) throw new Error('package not found')

    const order = (
      await c.query(
        `insert into "order"(org_id, supporter_id, subtotal_cents, total_cents, status)
         values ($1,$2,$3,$3,'pending') returning id`,
        [pkg.org_id, supporterId, pkg.price_cents],
      )
    ).rows[0]

    // Guards (inventory, sponsorship exclusivity) enforce here:
    await c.query(
      `insert into order_item(order_id, package_id, qty, unit_price_cents) values ($1,$2,1,$3)`,
      [order.id, packageId, pkg.price_cents],
    )

    const charge = await payments.charge({ orderId: order.id, grossCents: pkg.price_cents })
    await c.query('select record_payment($1,$2,$3,$4,$5)', [
      order.id,
      pkg.price_cents,
      charge.feeCents,
      charge.platformFeeCents,
      charge.intent,
    ])
  })

  revalidatePath('/golf')
  revalidatePath('/')
}

/**
 * Buy raffle tickets. Reuses the exact commerce spine: an order + order_item on
 * the raffle's entry package (revenue posts to the ledger via record_payment),
 * then N raffle_entry rows appended after the current high number. The
 * immutability trigger blocks this once entries are locked.
 */
export async function buyRaffleTickets(formData: FormData) {
  const uid = currentUid()
  const raffleId = String(formData.get('raffleId'))
  const packageId = String(formData.get('packageId'))
  const qty = Math.max(1, parseInt(String(formData.get('qty')), 10) || 1)

  await withUser(uid, async (c) => {
    const pkg = (await c.query('select org_id, price_cents from package where id=$1', [packageId])).rows[0]
    if (!pkg) throw new Error('ticket package not found')
    const total = pkg.price_cents * qty

    const supporter = (await c.query('select id from supporter limit 1')).rows[0]
    const order = (
      await c.query(
        `insert into "order"(org_id, supporter_id, subtotal_cents, total_cents, status)
         values ($1,$2,$3,$3,'pending') returning id`,
        [pkg.org_id, supporter?.id ?? null, total],
      )
    ).rows[0]
    await c.query(
      `insert into order_item(order_id, package_id, qty, unit_price_cents) values ($1,$2,$3,$4)`,
      [order.id, packageId, qty, pkg.price_cents],
    )

    const charge = await payments.charge({ orderId: order.id, grossCents: total })
    await c.query('select record_payment($1,$2,$3,$4,$5)', [
      order.id, total, charge.feeCents, charge.platformFeeCents, charge.intent,
    ])

    // Append qty entries after the current high number.
    await c.query(
      `insert into raffle_entry(raffle_id, org_id, supporter_id, order_id, entry_number, rules_version)
       select $1, $2, $3, $4,
              coalesce((select max(entry_number) from raffle_entry where raffle_id=$1),0) + gs,
              coalesce((select max(version) from raffle_rule_version where raffle_id=$1 and published_at is not null),1)
       from generate_series(1,$5) gs`,
      [raffleId, pkg.org_id, supporter?.id ?? null, order.id, qty],
    )
  })

  revalidatePath('/raffle')
  revalidatePath('/')
}

/** Lock the eligible set (immutable snapshot). */
export async function lockRaffle(formData: FormData) {
  const uid = currentUid()
  const raffleId = String(formData.get('raffleId'))
  await withUser(uid, (c) => c.query('select raffle_lock_entries($1)', [raffleId]))
  revalidatePath('/raffle')
}

/** Run the seeded, reproducible draw. */
export async function drawRaffle(formData: FormData) {
  const uid = currentUid()
  const raffleId = String(formData.get('raffleId'))
  const seed = `draw-${raffleId.slice(0, 8)}-${Date.now()}`
  await withUser(uid, (c) => c.query('select raffle_run_draw($1,$2)', [raffleId, seed]))
  revalidatePath('/raffle')
}

/**
 * Place a proxy/max bid as the acting user's supporter. Concurrency safety
 * lives in place_bid (SELECT ... FOR UPDATE); this just resolves the bidder and
 * calls it. Rejections (below increment, closed) come back in the jsonb result;
 * we revalidate either way so the page reflects current state.
 */
export async function placeBid(formData: FormData) {
  const uid = currentUid()
  const itemId = String(formData.get('itemId'))
  const maxDollars = parseFloat(String(formData.get('max')))
  const maxCents = Math.round((isFinite(maxDollars) ? maxDollars : 0) * 100)

  await withUser(uid, async (c) => {
    const sup = (
      await c.query(
        'select id from supporter where user_id=$1 union all select id from supporter limit 1',
        [uid],
      )
    ).rows[0]
    if (!sup) throw new Error('no supporter for bidder')
    await c.query('select place_bid($1,$2,$3) as r', [itemId, sup.id, maxCents])
  })

  revalidatePath('/auction')
}

/** Organizer closes a lot: sold if reserve cleared, else unsold. */
export async function closeLot(formData: FormData) {
  const uid = currentUid()
  const itemId = String(formData.get('itemId'))
  await withUser(uid, (c) => c.query('select auction_close_item($1)', [itemId]))
  revalidatePath('/auction')
}

/** 21-day binding go/no-go decision. */
export async function setGoNoGo(formData: FormData) {
  const uid = currentUid()
  const outingId = String(formData.get('outingId'))
  const decision = String(formData.get('decision')) // 'go' | 'no_go'
  await withUser(uid, (c) => c.query('select golf_set_go_no_go($1,$2)', [outingId, decision]))
  revalidatePath('/golf')
}

/** Lock the guaranteed golfer/meal count. */
export async function lockCount(formData: FormData) {
  const uid = currentUid()
  const outingId = String(formData.get('outingId'))
  const count = parseInt(String(formData.get('count')), 10)
  await withUser(uid, (c) => c.query('select golf_lock_count($1,$2)', [outingId, count]))
  revalidatePath('/golf')
}
