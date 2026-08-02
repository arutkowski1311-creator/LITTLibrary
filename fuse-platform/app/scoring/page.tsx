import { query } from '@/lib/db'
import { currentUid } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function ScoringPage() {
  const uid = currentUid()
  const org = (await query(uid, 'select id from organization limit 1')).rows[0]
  if (!org) return <div className="wrap"><h1>No organization</h1></div>

  const games = (
    await query(
      uid,
      `select g.id, g.opponent, g.starts_at, g.location, g.home, g.status, g.us_runs, g.them_runs, t.name as team
       from game g left join team t on t.id=g.team_id
       where g.org_id=$1 order by g.starts_at desc`,
      [org.id],
    )
  ).rows

  return (
    <div className="wrap">
      <div className="crumb"><a href="/">Dashboard</a> · Scoring</div>
      <h1>Games</h1>
      <p className="sub">Score a game live — every plate appearance updates the box score and feeds player development.</p>

      <div className="list">
        {games.map((g) => (
          <a key={g.id} className="row" href={`/scoring/${g.id}`}>
            <div>
              <div className="n">{g.team} {g.home ? 'vs' : '@'} {g.opponent}</div>
              <div className="m">{g.starts_at ? new Date(g.starts_at).toLocaleString() : ''} · {g.location}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {g.status !== 'scheduled' && <div style={{ fontWeight: 800, fontSize: 18 }}>{g.us_runs}–{g.them_runs}</div>}
              <span className={`pill ${g.status === 'final' ? 'draft' : g.status === 'live' ? 'live' : 'soon'}`}>{g.status}</span>
            </div>
          </a>
        ))}
        {games.length === 0 && <div className="card"><span className="m" style={{ color: 'var(--mute)' }}>No games scheduled.</span></div>}
      </div>
    </div>
  )
}
