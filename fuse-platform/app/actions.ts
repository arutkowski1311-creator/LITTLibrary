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
 * Launch a fundraiser from scratch. Creates the campaign plus the type-specific
 * scaffolding (golf outing + packages / raffle + prizes + rules + tickets /
 * auction + lots) with sensible defaults, so a freshly onboarded org has a
 * working, populated module page immediately. Runs as the org member (RLS).
 */
export async function createCampaign(formData: FormData) {
  const uid = currentUid()
  const type = String(formData.get('type'))
  const defaults: Record<string, string> = { golf: 'Charity Golf Outing', raffle: 'Fundraiser Raffle', auction: 'Benefit Auction', store: 'Team Store' }
  const title = (String(formData.get('title') || '').trim() || defaults[type] || 'Campaign')
  const slug = `${type}-${Date.now().toString(36)}`
  let dest = '/'

  await withUser(uid, async (c) => {
    const org = (await c.query('select id from organization limit 1')).rows[0]
    if (!org) throw new Error('no org')
    const status = type === 'raffle' ? 'draft' : 'published' // raffle waits on the compliance gate
    const goal = type === 'golf' ? 2000000 : type === 'raffle' ? 1000000 : 500000
    const camp = (
      await c.query(
        `insert into campaign(org_id,type,title,slug,status,goal_cents) values ($1,$2,$3,$4,$5,$6) returning id`,
        [org.id, type, title, slug, status, goal],
      )
    ).rows[0]

    if (type === 'golf') {
      const course = (await c.query('select id from golf_course limit 1')).rows[0]
      const pkg = course ? (await c.query('select id from golf_package where course_id=$1 limit 1', [course.id])).rows[0] : null
      const ev = (
        await c.query(
          `insert into event(org_id,campaign_id,name,starts_at,capacity)
           values ($1,$2,$3, now()+interval '60 days',144) returning id`,
          [org.id, camp.id, title],
        )
      ).rows[0]
      await c.query(
        `insert into golf_outing(org_id,event_id,course_id,package_id,proposed_date,deposit_cents,go_no_go_deadline)
         values ($1,$2,$3,$4,(now()+interval '60 days')::date,100000,(now()+interval '39 days')::date)`,
        [org.id, ev.id, course?.id ?? null, pkg?.id ?? null],
      )
      await c.query(
        `insert into package(org_id,campaign_id,event_id,kind,name,price_cents,qty_total,exclusive_category) values
         ($1,$2,$3,'registration','Foursome',60000,36,null),
         ($1,$2,$3,'registration','Individual Golfer',15000,20,null),
         ($1,$2,$3,'sponsorship','Title Sponsor',250000,1,'title'),
         ($1,$2,$3,'sponsorship','Hole Sponsor',25000,18,null)`,
        [org.id, camp.id, ev.id],
      )
      dest = '/golf'
    } else if (type === 'raffle') {
      const r = (await c.query(`insert into raffle(campaign_id,org_id,draw_at) values ($1,$2, now()+interval '45 days') returning id`, [camp.id, org.id])).rows[0]
      await c.query(`insert into raffle_prize(raffle_id,title,fmv_cents,winner_order) values ($1,'Grand Prize',50000,1),($1,'Runner-up',20000,2)`, [r.id])
      await c.query(`insert into raffle_rule_version(raffle_id,version,body,published_at) values ($1,1,'Official rules: 18+, see organization for details.', now())`, [r.id])
      await c.query(`insert into package(org_id,campaign_id,kind,name,price_cents,qty_total) values ($1,$2,'entry','Raffle Ticket',500,null)`, [org.id, camp.id])
      dest = '/raffle'
    } else if (type === 'auction') {
      const a = (await c.query(`insert into auction(campaign_id,org_id,mode,anti_snipe_seconds) values ($1,$2,'silent',120) returning id`, [camp.id, org.id])).rows[0]
      await c.query(
        `insert into auction_item(auction_id,org_id,title,fmv_cents,reserve_cents,min_bid_cents,increment_cents,closes_at) values
         ($1,$2,'Signed Memorabilia',30000,10000,5000,2500, now()+interval '7 days'),
         ($1,$2,'VIP Experience',50000,20000,10000,5000, now()+interval '7 days')`,
        [a.id, org.id],
      )
      dest = '/auction'
    } else if (type === 'store') {
      await c.query(
        `insert into package(org_id,campaign_id,kind,name,price_cents,qty_total) values
         ($1,$2,'product','Team Hoodie',4500,null),
         ($1,$2,'product','Fitted Cap',2200,null),
         ($1,$2,'product','Game Tee',1800,null),
         ($1,$2,'product','Car Magnet',1000,null)`,
        [org.id, camp.id],
      )
      dest = '/store'
    }
  })

  revalidatePath('/', 'layout')
  redirect(dest)
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

/**
 * Buy a store product crediting a specific player. Same commerce spine; the
 * player attribution rides on order_item.attribution_player, which powers the
 * per-player credit leaderboard. Checkout is gated on picking a player.
 */
export async function buyProduct(formData: FormData) {
  const uid = currentUid()
  const packageId = String(formData.get('packageId'))
  const playerId = String(formData.get('playerId'))
  if (!playerId) throw new Error('pick a player to support')

  await withUser(uid, async (c) => {
    const pkg = (await c.query('select org_id, price_cents from package where id=$1', [packageId])).rows[0]
    if (!pkg) throw new Error('product not found')
    const supporter = (await c.query('select id from supporter limit 1')).rows[0]
    const order = (
      await c.query(
        `insert into "order"(org_id,supporter_id,subtotal_cents,total_cents,status)
         values ($1,$2,$3,$3,'pending') returning id`,
        [pkg.org_id, supporter?.id ?? null, pkg.price_cents],
      )
    ).rows[0]
    await c.query(
      `insert into order_item(order_id,package_id,qty,unit_price_cents,attribution_player)
       values ($1,$2,1,$3,$4)`,
      [order.id, packageId, pkg.price_cents, playerId],
    )
    const charge = await payments.charge({ orderId: order.id, grossCents: pkg.price_cents })
    await c.query('select record_payment($1,$2,$3,$4,$5)', [
      order.id, pkg.price_cents, charge.feeCents, charge.platformFeeCents, charge.intent,
    ])
  })

  revalidatePath('/store')
  revalidatePath('/')
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
