import { query, money } from '@/lib/db'
import { currentUid } from '@/lib/auth'
import { purchasePackage, setGoNoGo, lockCount } from '../actions'

export const dynamic = 'force-dynamic'

export default async function GolfOuting() {
  const uid = currentUid()

  const outing = (
    await query(
      uid,
      `select go.*, c.name as course_name, c.location, e.name as event_name, e.starts_at,
              cm.id as campaign_id, cm.title, cm.goal_cents
       from golf_outing go
       join golf_course c on c.id = go.course_id
       join event e on e.id = go.event_id
       join campaign cm on cm.id = e.campaign_id
       limit 1`,
    )
  ).rows[0]

  if (!outing) return <div className="wrap"><h1>No outing</h1><p className="sub">Switch to an org member above.</p></div>

  const packages = (
    await query(
      uid,
      `select id, kind, name, price_cents, qty_total, qty_sold, exclusive_category
       from package where campaign_id=$1 order by kind desc, price_cents desc`,
      [outing.campaign_id],
    )
  ).rows

  const supporter = (await query(uid, 'select id, full_name from supporter limit 1')).rows[0]
  const summary =
    (await query(uid, 'select * from org_ledger_summary where org_id=$1', [outing.org_id])).rows[0] ?? {}

  // Package cost the org owes the course, from the package config.
  const pkgCost = (
    await query(
      uid,
      `select (green_fee_cents+cart_cents+food_cents+beverage_cents) as per_golfer
       from golf_package where course_id=$1 limit 1`,
      [outing.course_id],
    )
  ).rows[0]
  const soldFoursomes = Number(packages.find((p) => p.name === 'Foursome')?.qty_sold ?? 0)
  const estCourseCost = soldFoursomes * 4 * Number(pkgCost?.per_golfer ?? 0)
  const raised = Number(summary.net_proceeds_cents ?? 0)
  const estNet = raised - estCourseCost

  const decision: string = outing.go_no_go_decision
  const starts = outing.starts_at ? new Date(outing.starts_at).toLocaleDateString() : ''

  return (
    <div className="wrap">
      <div className="crumb"><a href="/">Dashboard</a> · Golf</div>
      <h1>{outing.title}</h1>
      <p className="sub">{outing.course_name} · {outing.location} · {starts}</p>

      {/* Commercial workflow */}
      <div className="grid cols-3" style={{ marginBottom: 8 }}>
        <div className="card kpi">
          <div className="v">{money(outing.deposit_cents)}</div>
          <div className="l">Reservation deposit {outing.deposit_paid ? '· paid' : '· due'}</div>
        </div>
        <div className="card">
          <div className="l" style={{ color: 'var(--mute)', fontSize: 12 }}>21-day go / no-go</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
            <span className={`pill ${decision === 'go' ? 'live' : decision === 'no_go' ? 'draft' : 'soon'}`}>
              {decision === 'pending' ? 'Pending' : decision === 'go' ? 'GO' : 'NO-GO'}
            </span>
            <form action={setGoNoGo}>
              <input type="hidden" name="outingId" value={outing.id} />
              <input type="hidden" name="decision" value="go" />
              <button className="btn spark" style={{ padding: '6px 12px' }}>Go</button>
            </form>
            <form action={setGoNoGo}>
              <input type="hidden" name="outingId" value={outing.id} />
              <input type="hidden" name="decision" value="no_go" />
              <button className="btn ghost" style={{ padding: '6px 12px' }}>No-go</button>
            </form>
          </div>
        </div>
        <div className="card">
          <div className="l" style={{ color: 'var(--mute)', fontSize: 12 }}>Guaranteed count</div>
          <div style={{ marginTop: 6 }}>
            {outing.guaranteed_count != null ? (
              <span className="pill live">{outing.guaranteed_count} locked</span>
            ) : (
              <form action={lockCount} style={{ display: 'flex', gap: 6 }}>
                <input type="hidden" name="outingId" value={outing.id} />
                <input name="count" type="number" defaultValue={soldFoursomes * 4} style={{ width: 70, padding: '6px 8px', border: '1px solid var(--line)', borderRadius: 8 }} />
                <button className="btn ghost" style={{ padding: '6px 12px' }}>Lock</button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Sell inventory */}
      <div className="section-h">Registration &amp; sponsorship</div>
      <div className="list">
        {packages.map((p) => {
          const soldOut = p.qty_total != null && p.qty_sold >= p.qty_total
          return (
            <div key={p.id} className="row">
              <div>
                <div className="n">{p.name} {p.exclusive_category ? <span className="pill soon" style={{ marginLeft: 6 }}>exclusive</span> : null}</div>
                <div className="m">
                  {money(p.price_cents)} · {p.qty_sold}{p.qty_total != null ? ` / ${p.qty_total}` : ''} sold
                </div>
              </div>
              {soldOut ? (
                <span className="pill draft">Sold out</span>
              ) : (
                <form action={purchasePackage}>
                  <input type="hidden" name="packageId" value={p.id} />
                  <input type="hidden" name="supporterId" value={supporter?.id ?? ''} />
                  <button className="btn" style={{ padding: '8px 14px' }}>
                    {p.kind === 'sponsorship' ? 'Sell' : 'Register'} →
                  </button>
                </form>
              )}
            </div>
          )
        })}
      </div>

      {/* Settlement reconciled to the ledger */}
      <div className="section-h">Settlement (live from the ledger)</div>
      <div className="card">
        <Line label="Gross received (org cash)" value={money(summary.org_cash_cents)} />
        <Line label="Processor fees" value={`− ${money(summary.processor_fees_cents)}`} />
        <Line label="Platform fee" value={`− ${money(summary.platform_fees_cents)}`} />
        <Line label="Net proceeds" value={money(raised)} strong />
        <div style={{ height: 1, background: 'var(--line)', margin: '10px 0' }} />
        <Line label={`Estimated course cost (${soldFoursomes} foursomes)`} value={`− ${money(estCourseCost)}`} />
        <Line label="Estimated net to org" value={money(estNet)} strong />
      </div>
      <p className="sub" style={{ marginTop: 12 }}>
        Every “Register / Sell” runs a fake Stripe charge and posts balanced entries to the ledger —
        these numbers are computed from <code>org_ledger_summary</code>, not hard-coded.
      </p>
    </div>
  )
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontWeight: strong ? 800 : 400 }}>
      <span style={{ color: strong ? 'var(--ink)' : 'var(--mute)' }}>{label}</span>
      <span>{value}</span>
    </div>
  )
}
