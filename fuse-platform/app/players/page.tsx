import { query } from '@/lib/db'
import { currentUid } from '@/lib/auth'
import { Sparkline } from '../components/charts'

export const dynamic = 'force-dynamic'

function avg(h: number, ab: number) {
  if (!ab) return '.000'
  return (h / ab).toFixed(3).replace(/^0/, '')
}

export default async function PlayersPage() {
  const uid = currentUid()
  const org = (await query(uid, 'select id from organization limit 1')).rows[0]
  if (!org) return <div className="wrap"><h1>No organization</h1></div>

  const players = (
    await query(
      uid,
      `select u.id, u.full_name, t.name as team,
              coalesce(o.overall, 0) as raw_overall,
              coalesce(s.h,0) as h, coalesce(s.ab,0) as ab, coalesce(s.hr,0) as hr, coalesce(s.rbi,0) as rbi
       from membership m
       join app_user u on u.id = m.user_id
       left join team t on t.id = m.team_id
       left join player_raw_overall o on o.player_id = u.id and o.org_id = m.org_id
       left join (select player_id, sum(h) h, sum(ab) ab, sum(hr) hr, sum(rbi) rbi
                  from player_game_stat where org_id=$1 group by player_id) s on s.player_id = u.id
       where m.org_id=$1 and m.role='player'
       order by raw_overall desc`,
      [org.id],
    )
  ).rows

  // Overall RAW over time per player → roster sparklines.
  const trend = (
    await query(
      uid,
      `select rs.player_id, rs.as_of,
              round(sum(rs.score * d.weight * p.weight) / nullif(sum(d.weight * p.weight),0)) as overall
       from raw_score rs
       join raw_domain d on d.id = rs.domain_id
       join raw_pillar p on p.id = d.pillar_id
       where rs.org_id=$1
       group by rs.player_id, rs.as_of order by rs.player_id, rs.as_of`,
      [org.id],
    )
  ).rows
  const trendBy: Record<string, number[]> = {}
  for (const r of trend) (trendBy[r.player_id] ??= []).push(Number(r.overall))

  return (
    <div className="wrap">
      <div className="crumb"><a href="/">Dashboard</a> · Roster</div>
      <h1>Roster &amp; development</h1>
      <p className="sub">RAW development index and season line for every player. Click through for the full report.</p>

      <div className="list">
        {players.map((p) => (
          <a key={p.id} className="row" href={`/players/${p.id}`}>
            <div>
              <div className="n">{p.full_name}</div>
              <div className="m">{p.team ?? 'Unrostered'} · {avg(Number(p.h), Number(p.ab))} AVG · {p.hr} HR · {p.rbi} RBI</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Sparkline values={trendBy[p.id] ?? []} color="var(--fuse)" />
              <div style={{ textAlign: 'right', minWidth: 34 }}>
                <div style={{ fontWeight: 800, fontSize: 20 }}>{p.raw_overall}</div>
                <div className="m" style={{ fontSize: 10, color: 'var(--mute)' }}>RAW</div>
              </div>
            </div>
          </a>
        ))}
        {players.length === 0 && <div className="card"><span className="m" style={{ color: 'var(--mute)' }}>No players on the roster yet.</span></div>}
      </div>
    </div>
  )
}
