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
