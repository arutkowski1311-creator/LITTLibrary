import { query } from '@/lib/db'
import { currentUid } from '@/lib/auth'
import { Radar, TrendChart, PILLAR_COLOR } from '../../components/charts'

export const dynamic = 'force-dynamic'

function avg(h: number, ab: number) {
  return !ab ? '.000' : (h / ab).toFixed(3).replace(/^0/, '')
}
function obp(h: number, bb: number, ab: number) {
  const pa = ab + bb
  return !pa ? '.000' : ((h + bb) / pa).toFixed(3).replace(/^0/, '')
}
function barColor(v: number) {
  return v >= 80 ? 'var(--good)' : v >= 60 ? 'var(--fuse)' : v >= 45 ? 'var(--warn)' : 'var(--bad)'
}

export default async function PlayerReport({ params }: { params: { id: string } }) {
  const uid = currentUid()
  const player = (await query(uid, 'select id, full_name from app_user where id=$1', [params.id])).rows[0]
  if (!player) return <div className="wrap"><h1>Player not found</h1></div>

  const overall = (await query(uid, 'select overall from player_raw_overall where player_id=$1', [params.id])).rows[0]?.overall ?? 0
  const pillars = (await query(uid, 'select pillar_name, score from player_pillar_score where player_id=$1 order by sort', [params.id])).rows
  const domains = (
    await query(
      uid,
      `select p.name as pillar, d.name, l.score
       from player_raw_latest l
       join raw_domain d on d.id = l.domain_id
       join raw_pillar p on p.id = d.pillar_id
       where l.player_id=$1 order by p.sort, d.sort`,
      [params.id],
    )
  ).rows
  const byPillar: Record<string, { name: string; score: number }[]> = {}
  for (const d of domains) (byPillar[d.pillar] ??= []).push({ name: d.name, score: Number(d.score) })

  // Radar axes across all domains, tinted by pillar.
  const radarAxes = domains.map((d) => ({ label: d.name, value: Number(d.score), color: PILLAR_COLOR[d.pillar] }))

  // Pillar scores over evaluation snapshots → multi-line trend.
  const trendRows = (
    await query(
      uid,
      `select rs.as_of, p.name as pillar, p.sort,
              round(sum(rs.score * d.weight) / nullif(sum(d.weight),0)) as score
       from raw_score rs
       join raw_domain d on d.id = rs.domain_id
       join raw_pillar p on p.id = d.pillar_id
       where rs.player_id=$1
       group by rs.as_of, p.name, p.sort order by rs.as_of, p.sort`,
      [params.id],
    )
  ).rows
  const trendDates = [...new Set(trendRows.map((r) => r.as_of.toISOString().slice(0, 10)))]
  const trendLabels = trendDates.map((d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
  const trendSeries = ['Physical', 'Technical', 'Psychological'].map((name) => ({
    name,
    color: PILLAR_COLOR[name],
    values: trendDates.map((d) => Number(trendRows.find((r) => r.as_of.toISOString().slice(0, 10) === d && r.pillar === name)?.score ?? 0)),
  })).filter((s) => s.values.some((v) => v > 0))

  const season = (
    await query(
      uid,
      `select coalesce(sum(ab),0) ab, coalesce(sum(h),0) h, coalesce(sum(b2),0) b2, coalesce(sum(b3),0) b3,
              coalesce(sum(hr),0) hr, coalesce(sum(rbi),0) rbi, coalesce(sum(bb),0) bb, coalesce(sum(so),0) so,
              coalesce(sum(r),0) r, coalesce(sum(sb),0) sb
       from player_game_stat where player_id=$1`,
      [params.id],
    )
  ).rows[0]

  const games = (
    await query(
      uid,
      `select g.opponent, g.starts_at, g.status, s.ab,s.h,s.hr,s.rbi,s.bb,s.so,s.r
       from player_game_stat s join game g on g.id=s.game_id
       where s.player_id=$1 order by g.starts_at desc`,
      [params.id],
    )
  ).rows

  return (
    <div className="wrap">
      <div className="crumb"><a href="/">Dashboard</a> · <a href="/players">Roster</a> · Report</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <h1 style={{ marginBottom: 0 }}>{player.full_name}</h1>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 800, fontSize: 34, lineHeight: 1, color: 'var(--fuse)' }}>{overall}</div>
          <div className="m" style={{ fontSize: 11, color: 'var(--mute)' }}>RAW SCORE</div>
        </div>
      </div>
      <p className="sub" style={{ marginTop: 6 }}>Development report · {avg(Number(season.h), Number(season.ab))} AVG / {obp(Number(season.h), Number(season.bb), Number(season.ab))} OBP</p>

      <div className="section-h">RAW DNA</div>
      <div className="grid cols-3" style={{ marginBottom: 10 }}>
        {pillars.map((p, i) => (
          <div key={i} className="card kpi" style={{ textAlign: 'center', boxShadow: `inset 3px 0 0 ${PILLAR_COLOR[p.pillar_name] ?? 'var(--fuse)'}` }}>
            <div className="v" style={{ color: PILLAR_COLOR[p.pillar_name] ?? barColor(Number(p.score)) }}>{p.score}</div>
            <div className="l">{p.pillar_name}</div>
          </div>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: '360px 1fr', gap: 14, marginBottom: 10, alignItems: 'stretch' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>RAW DNA profile</div>
          <Radar axes={radarAxes} />
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Development trend</div>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            {trendSeries.length > 0 ? <TrendChart labels={trendLabels} series={trendSeries} /> : <span className="m" style={{ color: 'var(--mute)' }}>Not enough evaluations yet.</span>}
          </div>
        </div>
      </div>

      {pillars.map((p) => (
        <div key={p.pillar_name} className="card" style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
            {p.pillar_name}
            {p.pillar_name === 'Psychological' && <span className="pill soon" style={{ marginLeft: 8 }}>coach-rated</span>}
          </div>
          {(byPillar[p.pillar_name] ?? []).map((d, i) => (
            <div key={i} style={{ margin: '7px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
                <span>{d.name}</span><span style={{ fontWeight: 700 }}>{d.score}</span>
              </div>
              <div className="bar"><i style={{ width: `${d.score}%`, background: PILLAR_COLOR[p.pillar_name] ?? barColor(d.score) }} /></div>
            </div>
          ))}
        </div>
      ))}

      <div className="section-h">Season line</div>
      <div className="grid cols-4">
        {[['AVG', avg(Number(season.h), Number(season.ab))], ['OBP', obp(Number(season.h), Number(season.bb), Number(season.ab))], ['HR', season.hr], ['RBI', season.rbi], ['H', season.h], ['AB', season.ab], ['BB', season.bb], ['SO', season.so], ['R', season.r], ['SB', season.sb]].map(([l, v], i) => (
          <div key={i} className="card kpi"><div className="v">{v as any}</div><div className="l">{l as any}</div></div>
        ))}
      </div>

      <div className="section-h">Game log</div>
      <div className="list">
        {games.map((g, i) => (
          <div key={i} className="row">
            <div>
              <div className="n">vs {g.opponent}</div>
              <div className="m">{g.starts_at ? new Date(g.starts_at).toLocaleDateString() : ''} · {g.status}</div>
            </div>
            <div className="m" style={{ fontSize: 13 }}>{g.h}-for-{g.ab}{g.hr > 0 ? `, ${g.hr} HR` : ''}{g.rbi > 0 ? `, ${g.rbi} RBI` : ''}</div>
          </div>
        ))}
        {games.length === 0 && <div className="card"><span className="m" style={{ color: 'var(--mute)' }}>No game data yet.</span></div>}
      </div>
    </div>
  )
}
