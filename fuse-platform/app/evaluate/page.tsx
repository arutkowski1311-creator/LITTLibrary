import { query } from '@/lib/db'
import { currentUid } from '@/lib/auth'
import { evaluateTeam } from '../actions'

export const dynamic = 'force-dynamic'

function barColor(v: number) {
  return v >= 80 ? 'var(--good)' : v >= 60 ? 'var(--fuse)' : v >= 45 ? 'var(--warn)' : 'var(--bad)'
}

export default async function Evaluate({ searchParams }: { searchParams: { d?: string } }) {
  const uid = currentUid()
  const org = (await query(uid, 'select id from organization limit 1')).rows[0]
  if (!org) return <div className="wrap"><h1>No organization</h1></div>

  const domains = (
    await query(
      uid,
      `select d.id, d.code, d.name, p.name as pillar, p.sort as psort, d.sort
       from raw_domain d join raw_pillar p on p.id=d.pillar_id order by p.sort, d.sort`,
    )
  ).rows
  const dom = domains.find((d) => d.code === (searchParams.d || 'cmp')) ?? domains[0]

  const roster = (
    await query(
      uid,
      `select u.id, u.full_name, l.score as current
       from membership m join app_user u on u.id=m.user_id
       left join player_raw_latest l on l.player_id=u.id and l.domain_id=$2
       where m.org_id=$1 and m.role='player'
       order by l.score desc nulls last, u.full_name`,
      [org.id, dom.id],
    )
  ).rows

  const scored = roster.filter((r) => r.current != null).map((r) => Number(r.current))
  const teamAvg = scored.length ? Math.round(scored.reduce((s, v) => s + v, 0) / scored.length) : null

  const byPillar: Record<string, any[]> = {}
  for (const d of domains) (byPillar[d.pillar] ??= []).push(d)

  return (
    <div className="wrap">
      <div className="crumb"><a href="/">Dashboard</a> · <a href="/players">Roster</a> · Evaluate</div>
      <h1>Team evaluation</h1>
      <p className="sub">Rate the whole roster on one trait at once — with the team in view, so every score has context.</p>

      {/* Trait picker, grouped by pillar */}
      <div className="section-h">Trait</div>
      {Object.entries(byPillar).map(([pillar, ds]) => (
        <div key={pillar} style={{ marginBottom: 8 }}>
          <div className="m" style={{ fontSize: 11, fontWeight: 700, color: 'var(--mute)', marginBottom: 4 }}>{pillar.toUpperCase()}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {ds.map((d) => (
              <a key={d.code} href={`/evaluate?d=${d.code}`} className={`btn ${d.code === dom.code ? 'spark' : 'ghost'}`} style={{ padding: '6px 12px', fontSize: 13, textDecoration: 'none' }}>{d.name}</a>
            ))}
          </div>
        </div>
      ))}

      {/* Whole-roster comparative rating */}
      <div className="section-h">{dom.name} · team average {teamAvg ?? '—'}</div>
      <form action={evaluateTeam}>
        <input type="hidden" name="domainId" value={dom.id} />
        <div className="card">
          {roster.map((p) => {
            const cur = p.current == null ? 50 : Number(p.current)
            return (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 70px', gap: 12, alignItems: 'center', padding: '7px 0', borderTop: '1px solid var(--line)' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.full_name}</div>
                <div className="bar"><i style={{ width: `${cur}%`, background: barColor(cur) }} /></div>
                <input name={`score_${p.id}`} type="number" min={0} max={100} defaultValue={cur}
                  style={{ width: 64, padding: '7px 8px', border: '1px solid var(--line)', borderRadius: 8, textAlign: 'center', fontWeight: 700 }} />
              </div>
            )
          })}
          {roster.length === 0 && <div className="m" style={{ color: 'var(--mute)' }}>No players on the roster.</div>}
        </div>
        <button className="btn spark" style={{ marginTop: 12 }}>Save evaluation</button>
      </form>
      <p className="sub" style={{ marginTop: 12 }}>
        Saving writes today’s score for each player and updates their RAW index. Re-evaluate over the season to build a
        development trend. Psychological traits are entirely coach-judged — this comparative view is how you keep them honest.
      </p>
    </div>
  )
}
