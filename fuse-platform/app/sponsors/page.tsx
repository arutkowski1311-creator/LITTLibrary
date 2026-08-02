import { query, money } from '@/lib/db'
import { currentUid } from '@/lib/auth'
import { addSponsor, addDeliverable, fulfillDeliverable } from '../actions'

export const dynamic = 'force-dynamic'

const input = { padding: '9px 11px', border: '1px solid var(--line)', borderRadius: 9, fontSize: 13, background: '#fff' } as const

export default async function SponsorsPage() {
  const uid = currentUid()
  const org = (await query(uid, 'select id from organization limit 1')).rows[0]
  if (!org) return <div className="wrap"><h1>No organization</h1><p className="sub">Switch to an org member above.</p></div>

  // Cross-module sponsorship inventory (the unified view).
  const inventory = (
    await query(
      uid,
      `select pk.name, pk.price_cents, pk.qty_sold, pk.qty_total, pk.exclusive_category, c.title as campaign, c.type
       from package pk join campaign c on c.id = pk.campaign_id
       where pk.org_id=$1 and pk.kind='sponsorship' order by c.title, pk.price_cents desc`,
      [org.id],
    )
  ).rows

  const sponsors = (await query(uid, 'select * from sponsor where org_id=$1 order by business', [org.id])).rows
  const deliverables = (await query(uid, 'select * from sponsor_deliverable where org_id=$1 order by due_date', [org.id])).rows
  const delivBy: Record<string, any[]> = {}
  for (const d of deliverables) (delivBy[d.sponsor_id] ??= []).push(d)

  const soldCount = inventory.filter((i) => i.qty_sold > 0).length

  return (
    <div className="wrap">
      <div className="crumb"><a href="/">Dashboard</a> · Sponsorship CRM</div>
      <h1>Sponsorship CRM</h1>
      <p className="sub">Every sponsor, every obligation, every dollar — across all your fundraisers in one place.</p>

      {/* Unified inventory across campaigns */}
      <div className="section-h">Inventory · {soldCount}/{inventory.length} sold</div>
      <div className="list">
        {inventory.map((i, n) => {
          const sold = i.qty_total != null && i.qty_sold >= i.qty_total
          return (
            <div key={n} className="row">
              <div>
                <div className="n">
                  {i.name}
                  {i.exclusive_category && <span className="pill soon" style={{ marginLeft: 6 }}>exclusive · {i.exclusive_category}</span>}
                </div>
                <div className="m">{i.campaign} · {money(i.price_cents)} · {i.qty_sold}{i.qty_total != null ? ` / ${i.qty_total}` : ''} sold</div>
              </div>
              <span className={`pill ${sold ? 'live' : 'draft'}`}>{sold ? 'sold' : 'available'}</span>
            </div>
          )
        })}
        {inventory.length === 0 && <div className="card"><span className="m" style={{ color: 'var(--mute)' }}>No sponsorship inventory yet — add sponsor packages to a golf outing or event.</span></div>}
      </div>

      {/* Sponsor relationships + deliverables */}
      <div className="section-h">Sponsors</div>
      <div className="list">
        {sponsors.map((s) => {
          const ds = delivBy[s.id] ?? []
          return (
            <div key={s.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <b>{s.business}</b>
                  {s.category && <span className="pill soon" style={{ marginLeft: 8 }}>{s.category}</span>}
                  <div className="m" style={{ color: 'var(--mute)', fontSize: 12, marginTop: 2 }}>
                    {s.contact_name}{s.contact_email ? ` · ${s.contact_email}` : ''}{s.renewal_date ? ` · renews ${new Date(s.renewal_date).toLocaleDateString()}` : ''}
                  </div>
                </div>
              </div>
              {s.notes && <div className="m" style={{ color: 'var(--mute)', fontSize: 12, marginTop: 6 }}>{s.notes}</div>}

              <div style={{ marginTop: 10, borderTop: '1px solid var(--line)', paddingTop: 8 }}>
                <div className="m" style={{ fontSize: 11, fontWeight: 700, color: 'var(--mute)', marginBottom: 6 }}>DELIVERABLES</div>
                {ds.map((d) => (
                  <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: 13 }}>
                    <span>{d.description}{d.due_date ? <span style={{ color: 'var(--mute)' }}> · due {new Date(d.due_date).toLocaleDateString()}</span> : null}</span>
                    {d.status === 'fulfilled' ? (
                      <span className="pill live">fulfilled</span>
                    ) : (
                      <form action={fulfillDeliverable} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input type="hidden" name="id" value={d.id} />
                        <span className="pill soon">{d.status}</span>
                        <button className="btn ghost" style={{ padding: '4px 9px', fontSize: 11 }}>Mark fulfilled</button>
                      </form>
                    )}
                  </div>
                ))}
                <form action={addDeliverable} style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <input type="hidden" name="sponsorId" value={s.id} />
                  <input name="description" placeholder="New deliverable…" style={{ ...input, flex: 1 }} required />
                  <input name="due_date" type="date" style={input} />
                  <button className="btn ghost" style={{ fontSize: 12 }}>Add</button>
                </form>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add a sponsor */}
      <div className="section-h">Add sponsor</div>
      <form action={addSponsor} className="card" style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
        <input name="business" placeholder="Business name" style={input} required />
        <input name="category" placeholder="Category (e.g. auto_dealer)" style={input} />
        <input name="contact_name" placeholder="Contact name" style={input} />
        <input name="contact_email" placeholder="Contact email" style={input} />
        <input name="renewal_date" type="date" style={input} />
        <button className="btn spark">Add sponsor</button>
      </form>
    </div>
  )
}
