import { query, money } from '@/lib/db'
import { currentUid } from '@/lib/auth'
import { buyProduct } from '../actions'

export const dynamic = 'force-dynamic'

export default async function StorePage() {
  const uid = currentUid()

  const store = (
    await query(
      uid,
      `select c.id, c.title, c.org_id from campaign c where c.type='store' order by c.created_at desc limit 1`,
    )
  ).rows[0]
  if (!store) return <div className="wrap"><h1>No store</h1><p className="sub">Launch a Team Store from the dashboard.</p></div>

  const products = (
    await query(uid, `select id, name, price_cents from package where campaign_id=$1 and kind='product' order by price_cents desc`, [store.id])
  ).rows

  const players = (
    await query(
      uid,
      `select u.id, u.full_name from membership m join app_user u on u.id=m.user_id
       where m.org_id=$1 and m.role='player' order by u.full_name`,
      [store.org_id],
    )
  ).rows

  // Per-player credit = net proceeds of orders attributed to that player.
  const credit = (
    await query(
      uid,
      `select oi.attribution_player as pid,
              coalesce(sum(le.amount_cents) filter (where le.party='fund' and le.direction='credit'),0) as credit_cents,
              count(distinct o.id) as orders
       from order_item oi
       join package pk on pk.id = oi.package_id
       join "order" o on o.id = oi.order_id
       left join ledger_entry le on le.order_id = o.id
       where pk.campaign_id=$1 and oi.attribution_player is not null
       group by oi.attribution_player`,
      [store.id],
    )
  ).rows
  const creditBy: Record<string, { credit: number; orders: number }> = {}
  for (const r of credit) creditBy[r.pid] = { credit: Number(r.credit_cents), orders: Number(r.orders) }

  const totalRaised = credit.reduce((s, r) => s + Number(r.credit_cents), 0)
  const board = players
    .map((p) => ({ name: p.full_name, ...(creditBy[p.id] ?? { credit: 0, orders: 0 }) }))
    .sort((a, b) => b.credit - a.credit)

  return (
    <div className="wrap">
      <div className="crumb"><a href="/">Dashboard</a> · Team Store</div>
      <h1>{store.title}</h1>
      <p className="sub">Every order credits a player. You’re the storefront — pickup/distribution is local, no shipping.</p>

      <div className="section-h">Shop</div>
      <div className="grid cols-3">
        {products.map((p) => (
          <form key={p.id} action={buyProduct} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input type="hidden" name="packageId" value={p.id} />
            <b>{p.name}</b>
            <div style={{ fontWeight: 800, fontSize: 20 }}>{money(p.price_cents)}</div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--mute)' }}>Which player are you supporting?</label>
            <select name="playerId" required defaultValue="" style={{ padding: 8, border: '1px solid var(--line)', borderRadius: 8, fontSize: 13 }}>
              <option value="" disabled>Pick a player…</option>
              {players.map((pl) => <option key={pl.id} value={pl.id}>{pl.full_name}</option>)}
            </select>
            <button className="btn spark" style={{ marginTop: 'auto' }}>Add &amp; check out</button>
          </form>
        ))}
      </div>

      <div className="section-h">Player credit leaderboard · {money(totalRaised)} total</div>
      <div className="list">
        {board.map((r, i) => (
          <div key={i} className="row">
            <div><div className="n">{i + 1}. {r.name}</div><div className="m">{r.orders} order{r.orders === 1 ? '' : 's'}</div></div>
            <span style={{ fontWeight: 800 }}>{money(r.credit)}</span>
          </div>
        ))}
      </div>
      <p className="sub" style={{ marginTop: 12 }}>
        Purchases run through the same checkout → <code>record_payment</code> → ledger path; the leaderboard reads
        net proceeds attributed to each player via <code>order_item.attribution_player</code>.
      </p>
    </div>
  )
}
