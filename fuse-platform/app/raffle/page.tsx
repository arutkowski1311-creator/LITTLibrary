import { query, money } from '@/lib/db'
import { currentUid } from '@/lib/auth'
import { buyRaffleTickets, lockRaffle, drawRaffle } from '../actions'

export const dynamic = 'force-dynamic'

export default async function RafflePage() {
  const uid = currentUid()

  const raffle = (
    await query(
      uid,
      `select r.*, c.title, c.goal_cents, c.id as campaign_id, o.jurisdiction
       from raffle r
       join campaign c on c.id = r.campaign_id
       join organization o on o.id = r.org_id
       order by r.created_at desc limit 1`,
    )
  ).rows[0]
  if (!raffle) return <div className="wrap"><h1>No raffle</h1><p className="sub">Switch to an org member above.</p></div>

  const prizes = (await query(uid, 'select * from raffle_prize where raffle_id=$1 order by winner_order', [raffle.id])).rows
  const ticket = (await query(uid, "select id, price_cents from package where campaign_id=$1 and kind='entry' limit 1", [raffle.campaign_id])).rows[0]
  const stats = (
    await query(
      uid,
      `select count(*)::int as entries,
              coalesce(count(distinct supporter_id),0)::int as supporters
       from raffle_entry where raffle_id=$1`,
      [raffle.id],
    )
  ).rows[0]

  // Compliance gate, shown as three checks
  const rule = (await query(uid, "select * from jurisdiction_rule where jurisdiction=$1 and module='raffle'", [raffle.jurisdiction])).rows[0]
  const rulesPublished = (await query(uid, 'select count(*)::int n from raffle_rule_version where raffle_id=$1 and published_at is not null', [raffle.id])).rows[0].n
  const checks = [
    { ok: !!rule?.allowed, label: `Raffles allowed in ${raffle.jurisdiction}` },
    { ok: !rule?.requires_license || !!raffle.license_number, label: rule?.requires_license ? `License on file (${raffle.license_number || '—'})` : 'No license required' },
    { ok: rulesPublished > 0, label: 'Official rules published' },
  ]
  const gatePassed = checks.every((c) => c.ok)

  const winners = (
    await query(
      uid,
      `select rp.title as prize, re.entry_number, d.seed, d.snapshot_hash, d.drawn_at
       from raffle_draw d
       join raffle_winner w on w.draw_id = d.id
       join raffle_prize rp on rp.id = w.prize_id
       join raffle_entry re on re.id = w.entry_id
       where d.raffle_id=$1 order by rp.winner_order`,
      [raffle.id],
    )
  ).rows

  const raised = Number(ticket?.price_cents ?? 0) * stats.entries
  const goal = Number(raffle.goal_cents ?? 0)
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0
  const locked = !!raffle.entries_locked_at

  return (
    <div className="wrap">
      <div className="crumb"><a href="/">Dashboard</a> · Raffle</div>
      <h1>{raffle.title}</h1>
      <p className="sub">Draw {raffle.draw_at ? new Date(raffle.draw_at).toLocaleDateString() : 'TBD'} · {stats.entries} entries from {stats.supporters} supporters</p>

      {/* Compliance gate */}
      <div className="card" style={{ marginBottom: 14, borderColor: gatePassed ? 'var(--good)' : 'var(--warn)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <b>Compliance gate</b>
          <span className={`pill ${gatePassed ? 'live' : 'soon'}`}>{gatePassed ? 'Publishable' : 'Blocked'}</span>
        </div>
        {checks.map((c, i) => (
          <div key={i} style={{ fontSize: 13, color: c.ok ? 'var(--ink)' : 'var(--bad)', padding: '2px 0' }}>
            {c.ok ? '✓' : '✗'} {c.label}
          </div>
        ))}
      </div>

      {/* Thermometer */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontWeight: 800, fontSize: 20 }}>{money(raised)}</div>
          <div className="m" style={{ color: 'var(--mute)', fontSize: 13 }}>of {money(goal)} · {pct}%</div>
        </div>
        <div className="bar" style={{ marginTop: 10 }}><i style={{ width: `${pct}%` }} /></div>
      </div>

      {/* Buy tickets */}
      <div className="section-h">Buy tickets · {money(ticket?.price_cents)} each</div>
      {locked ? (
        <div className="card"><span className="pill draft">Entries locked — sales closed</span></div>
      ) : (
        <div className="grid cols-3">
          {[1, 5, 20].map((q) => (
            <form key={q} action={buyRaffleTickets} className="card" style={{ textAlign: 'center' }}>
              <input type="hidden" name="raffleId" value={raffle.id} />
              <input type="hidden" name="packageId" value={ticket?.id ?? ''} />
              <input type="hidden" name="qty" value={q} />
              <div style={{ fontWeight: 800, fontSize: 22 }}>{q}</div>
              <div className="l" style={{ color: 'var(--mute)', fontSize: 12, marginBottom: 10 }}>ticket{q > 1 ? 's' : ''} · {money((ticket?.price_cents ?? 0) * q)}</div>
              <button className="btn spark" style={{ width: '100%' }}>Buy</button>
            </form>
          ))}
        </div>
      )}

      {/* Organizer: prizes + lock + draw */}
      <div className="section-h">Prizes</div>
      <div className="list">
        {prizes.map((p) => (
          <div key={p.id} className="row">
            <div><div className="n">{p.title}</div><div className="m">Prize #{p.winner_order} · FMV {money(p.fmv_cents)}</div></div>
          </div>
        ))}
      </div>

      <div className="section-h">Draw</div>
      <div className="card">
        {winners.length > 0 ? (
          <>
            <div style={{ marginBottom: 8 }}><b>Winners drawn</b> · {new Date(winners[0].drawn_at).toLocaleString()}</div>
            {winners.map((w, i) => (
              <div key={i} className="row" style={{ marginBottom: 8 }}>
                <div><div className="n">{w.prize}</div><div className="m">Winning entry #{w.entry_number}</div></div>
                <span className="pill live">winner</span>
              </div>
            ))}
            <div className="m" style={{ color: 'var(--mute)', fontSize: 11, marginTop: 6, wordBreak: 'break-all' }}>
              Verifiable · seed <code>{winners[0].seed}</code> · snapshot <code>{winners[0].snapshot_hash}</code>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {!locked ? (
              <form action={lockRaffle}>
                <input type="hidden" name="raffleId" value={raffle.id} />
                <button className="btn ghost">Lock entries ({stats.entries})</button>
              </form>
            ) : (
              <>
                <span className="pill soon">Locked · snapshot {String(raffle.snapshot_hash).slice(0, 10)}…</span>
                <form action={drawRaffle}>
                  <input type="hidden" name="raffleId" value={raffle.id} />
                  <button className="btn spark">Run draw</button>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
