import { query, money } from '@/lib/db'
import { currentUid } from '@/lib/auth'
import { subscribeStreaming, sellAd } from '../actions'

export const dynamic = 'force-dynamic'

export default async function StreamingPage() {
  const uid = currentUid()

  const camp = (await query(uid, `select id, title, org_id from campaign where type='streaming' order by created_at desc limit 1`)).rows[0]
  if (!camp) return <div className="wrap"><h1>No streaming campaign</h1><p className="sub">Launch Streaming from the dashboard.</p></div>

  const pass = (await query(uid, `select id, price_cents from package where campaign_id=$1 and kind='ticket' limit 1`, [camp.id])).rows[0]
  const ads = (await query(uid, `select id, name, price_cents, qty_sold, qty_total from package where campaign_id=$1 and kind='ad' order by price_cents desc`, [camp.id])).rows

  const subs = pass
    ? Number((await query(uid, `select count(*)::int n from order_item oi join "order" o on o.id=oi.order_id and o.status='paid' where oi.package_id=$1`, [pass.id])).rows[0].n)
    : 0

  // Net revenue attributed to this campaign, split by subscription vs ad.
  const byKind = (
    await query(
      uid,
      `select pk.kind, coalesce(sum(le.amount_cents) filter (where le.party='fund' and le.direction='credit'),0) as net
       from order_item oi
       join package pk on pk.id = oi.package_id
       join ledger_entry le on le.order_id = oi.order_id
       where pk.campaign_id=$1 group by pk.kind`,
      [camp.id],
    )
  ).rows
  const subNet = Number(byKind.find((r) => r.kind === 'ticket')?.net ?? 0)
  const adNet = Number(byKind.find((r) => r.kind === 'ad')?.net ?? 0)
  const price = Number(pass?.price_cents ?? 0)
  const mrr = subs * price

  return (
    <div className="wrap">
      <div className="crumb"><a href="/">Dashboard</a> · Streaming</div>
      <h1>{camp.title}</h1>
      <p className="sub">Streaming pays for itself — subscriptions plus an advertising marketplace, all to the ledger.</p>

      <div className="grid cols-4">
        <div className="card kpi"><div className="v">{subs}</div><div className="l">Subscribers</div></div>
        <div className="card kpi"><div className="v">{money(mrr)}</div><div className="l">Monthly recurring (gross)</div></div>
        <div className="card kpi"><div className="v">{money(subNet)}</div><div className="l">Subscription net (70% share)</div></div>
        <div className="card kpi"><div className="v">{money(adNet)}</div><div className="l">Ad revenue net</div></div>
      </div>

      {/* Subscriptions */}
      <div className="section-h">Subscriptions · {money(price)}/mo</div>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="n" style={{ fontWeight: 700 }}>Season Pass</div>
          <div className="m" style={{ color: 'var(--mute)', fontSize: 12 }}>
            Org keeps 70% · platform 30% · {money(price)} gross → {money(Math.round(price * 0.7) - (Math.round(price * 0.029) + 30))} to org after fees
          </div>
        </div>
        <form action={subscribeStreaming}>
          <button className="btn spark">Subscribe a viewer</button>
        </form>
      </div>

      {/* Advertising marketplace */}
      <div className="section-h">Advertising inventory</div>
      <div className="grid cols-3">
        {ads.map((a) => {
          const soldOut = a.qty_total != null && a.qty_sold >= a.qty_total
          return (
            <div key={a.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <b>{a.name}</b>
              <div style={{ fontWeight: 800, fontSize: 20 }}>{money(a.price_cents)}</div>
              <div className="m" style={{ color: 'var(--mute)', fontSize: 12 }}>{a.qty_sold}{a.qty_total != null ? ` / ${a.qty_total}` : ''} sold</div>
              {soldOut ? (
                <span className="pill draft" style={{ alignSelf: 'flex-start', marginTop: 'auto' }}>Sold out</span>
              ) : (
                <form action={sellAd} style={{ marginTop: 'auto' }}>
                  <input type="hidden" name="packageId" value={a.id} />
                  <button className="btn" style={{ width: '100%' }}>Sell slot →</button>
                </form>
              )}
            </div>
          )
        })}
      </div>
      <p className="sub" style={{ marginTop: 14 }}>
        Subscriptions post the org’s 70% rev-share to the ledger (platform’s 30% booked as the platform fee); ad sales
        post at the standard facilitation fee. Ad slots are inventory-guarded — you can’t oversell a placement.
      </p>
    </div>
  )
}
