import { query, money } from '@/lib/db'
import { currentUid, currentUser } from '@/lib/auth'
import { placeBid, closeLot } from '../actions'

export const dynamic = 'force-dynamic'

export default async function AuctionPage() {
  const uid = currentUid()
  const me = currentUser()

  const auction = (
    await query(
      uid,
      `select a.*, c.title from auction a join campaign c on c.id=a.campaign_id order by a.created_at desc limit 1`,
    )
  ).rows[0]
  if (!auction) return <div className="wrap"><h1>No auction</h1><p className="sub">Switch to an org member above.</p></div>

  const mySup = (await query(uid, 'select id from supporter where user_id=$1 limit 1', [uid])).rows[0]

  const items = (
    await query(
      uid,
      `select i.*, s.full_name as leader_name
       from auction_item i
       left join supporter s on s.id = i.current_bidder
       where i.auction_id=$1 order by i.created_at`,
      [auction.id],
    )
  ).rows

  return (
    <div className="wrap">
      <div className="crumb"><a href="/">Dashboard</a> · Auction</div>
      <h1>{auction.title}</h1>
      <p className="sub">
        {auction.mode} · {items.length} lots · anti-snipe {auction.anti_snipe_seconds}s · bidding as {me.name}
      </p>

      <div className="grid cols-3">
        {items.map((i) => {
          const hasBid = i.current_bid_cents != null
          const minNext = hasBid ? Number(i.current_bid_cents) + Number(i.increment_cents) : Number(i.min_bid_cents)
          const winning = mySup && i.current_bidder === mySup.id
          const reserveMet = hasBid && Number(i.current_bid_cents) >= Number(i.reserve_cents)
          const open = i.state === 'open'
          return (
            <div key={i.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <b>{i.title}</b>
                {i.state === 'sold' ? <span className="pill live">sold</span>
                  : i.state === 'unsold' ? <span className="pill draft">unsold</span>
                  : reserveMet ? <span className="pill live">reserve met</span>
                  : <span className="pill soon">reserve {money(i.reserve_cents)}</span>}
              </div>
              <div className="m" style={{ color: 'var(--mute)', fontSize: 12 }}>FMV {money(i.fmv_cents)}</div>

              <div>
                <div style={{ fontWeight: 800, fontSize: 22 }}>
                  {hasBid ? money(i.current_bid_cents) : money(i.min_bid_cents)}
                </div>
                <div className="m" style={{ color: 'var(--mute)', fontSize: 12 }}>
                  {hasBid ? `high bid · ${i.leader_name ?? 'someone'}` : 'opening bid'}
                </div>
              </div>

              {winning && open && <span className="pill live" style={{ alignSelf: 'flex-start' }}>You’re winning</span>}

              {open ? (
                <form action={placeBid} style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                  <input type="hidden" name="itemId" value={i.id} />
                  <span style={{ alignSelf: 'center', color: 'var(--mute)', fontSize: 13 }}>$</span>
                  <input
                    name="max"
                    type="number"
                    step="0.01"
                    min={(minNext / 100).toFixed(2)}
                    defaultValue={(minNext / 100).toFixed(2)}
                    style={{ width: 80, padding: '8px', border: '1px solid var(--line)', borderRadius: 8 }}
                  />
                  <button className="btn spark" style={{ flex: 1 }}>Bid</button>
                </form>
              ) : (
                <div className="m" style={{ color: 'var(--mute)', fontSize: 12, marginTop: 'auto' }}>
                  {i.state === 'sold' ? `Won by ${i.leader_name} · ${money(i.current_bid_cents)}` : 'Closed — no sale'}
                </div>
              )}

              {open && (
                <form action={closeLot}>
                  <input type="hidden" name="itemId" value={i.id} />
                  <button className="btn ghost" style={{ width: '100%', fontSize: 12, padding: '6px' }}>Close lot (organizer)</button>
                </form>
              )}
            </div>
          )
        })}
      </div>

      <p className="sub" style={{ marginTop: 18 }}>
        Bids run through <code>place_bid</code> — proxy/max bidding with a row lock for concurrency and anti-snipe
        extension. Switch personas above to bid against yourself and watch the proxy resolve.
      </p>
    </div>
  )
}
