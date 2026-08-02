import { query, money } from '@/lib/db'
import { currentUid } from '@/lib/auth'
import { createCampaign } from './actions'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const uid = currentUid()

  const org = (await query(uid, 'select * from organization limit 1')).rows[0]
  if (!org) {
    return (
      <div className="wrap">
        <h1>Welcome to Fuse</h1>
        <p className="sub">You’re not part of an organization yet. Set one up in under a minute.</p>
        <a className="btn spark" href="/onboarding" style={{ padding: 14 }}>Create your organization →</a>
      </div>
    )
  }

  const modules = (
    await query(uid, 'select distinct module_key from entitlement where org_id=$1 order by module_key', [org.id])
  ).rows.map((r) => r.module_key)

  const summary =
    (await query(uid, 'select * from org_ledger_summary where org_id=$1', [org.id])).rows[0] ?? {}
  const campaigns = (
    await query(
      uid,
      `select c.id, c.type, c.title, c.status, c.goal_cents,
              coalesce((
                select sum(le.amount_cents) filter (where le.party='fund' and le.direction='credit')
                from ledger_entry le
                where le.order_id in (
                  select distinct oi.order_id from order_item oi
                  join package pk on pk.id = oi.package_id
                  where pk.campaign_id = c.id
                )
              ), 0) as raised_cents
       from campaign c where c.org_id=$1 order by c.created_at`,
      [org.id],
    )
  ).rows

  const goal = Number(org.annual_goal_cents ?? 0) || campaigns.reduce((s, c) => s + Number(c.goal_cents ?? 0), 0)
  const raised = Number(summary.net_proceeds_cents ?? 0)
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0

  return (
    <div className="wrap">
      <div className="crumb">{org.public_name}</div>
      <h1>Fundraising dashboard</h1>
      <p className="sub">One org, every dollar. Revenue posts to the ledger the moment a payment clears.</p>

      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontWeight: 800, fontSize: 20 }}>{money(raised)} raised</div>
          <div className="m" style={{ color: 'var(--mute)', fontSize: 13 }}>
            of {money(goal)} goal · {pct}%
          </div>
        </div>
        <div className="bar" style={{ marginTop: 10 }}>
          <i style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="grid cols-4">
        <div className="card kpi"><div className="v">{money(summary.net_proceeds_cents)}</div><div className="l">Net proceeds</div></div>
        <div className="card kpi"><div className="v">{money(summary.org_cash_cents)}</div><div className="l">Org cash</div></div>
        <div className="card kpi"><div className="v">{money(summary.platform_fees_cents)}</div><div className="l">Platform fees</div></div>
        <div className="card kpi"><div className="v">{money(summary.processor_fees_cents)}</div><div className="l">Processor fees</div></div>
      </div>

      <div className="section-h">Your modules</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {modules.length === 0 ? (
          <span className="m" style={{ color: 'var(--mute)' }}>No modules enabled.</span>
        ) : (
          modules.map((m) => {
            const path: Record<string, string> = { golf: '/golf', raffle: '/raffle', auction: '/auction', store: '/store', sponsorship: '/sponsors', streaming: '/streaming' }
            return path[m] ? (
              <a key={m} className="pill soon" href={path[m]} style={{ textDecoration: 'none' }}>{m} →</a>
            ) : (
              <span key={m} className="pill soon">{m}</span>
            )
          })
        )}
      </div>

      <div className="section-h">Launch a fundraiser</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { type: 'golf', label: '⛳ Golf outing' },
          { type: 'raffle', label: '🎟️ Raffle' },
          { type: 'auction', label: '🔨 Auction' },
          { type: 'store', label: '🛍️ Team store' },
          { type: 'streaming', label: '📡 Streaming' },
        ]
          .filter((x) => modules.includes(x.type))
          .map((x) => (
            <form key={x.type} action={createCampaign}>
              <input type="hidden" name="type" value={x.type} />
              <button className="btn ghost">{x.label}</button>
            </form>
          ))}
        {modules.filter((m) => ['golf', 'raffle', 'auction'].includes(m)).length === 0 && (
          <span className="m" style={{ color: 'var(--mute)' }}>No fundraiser modules enabled — add them in onboarding.</span>
        )}
      </div>

      <div className="section-h">Campaigns</div>
      <div className="list">
        {campaigns.map((c) => {
          const href = c.type === 'golf' ? '/golf' : c.type === 'raffle' ? '/raffle' : c.type === 'auction' ? '/auction' : c.type === 'store' ? '/store' : c.type === 'streaming' ? '/streaming' : undefined
          const inner = (
            <>
              <div>
                <div className="n">{c.title}</div>
                <div className="m">
                  {c.type} · {money(c.raised_cents)} raised{c.goal_cents ? ` of ${money(c.goal_cents)}` : ''}
                </div>
              </div>
              <span className={`pill ${c.status === 'published' ? 'live' : 'draft'}`}>{c.status}</span>
            </>
          )
          return href ? (
            <a key={c.id} className="row" href={href}>{inner}</a>
          ) : (
            <div key={c.id} className="row">{inner}</div>
          )
        })}
      </div>
    </div>
  )
}
