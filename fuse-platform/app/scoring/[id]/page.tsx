import { query } from '@/lib/db'
import { currentUid } from '@/lib/auth'
import { recordPa, finalizeGame } from '../../actions'

export const dynamic = 'force-dynamic'

const RESULTS = [
  { v: 'single', l: '1B' }, { v: 'double', l: '2B' }, { v: 'triple', l: '3B' }, { v: 'home_run', l: 'HR' },
  { v: 'walk', l: 'BB' }, { v: 'strikeout', l: 'K' }, { v: 'out', l: 'OUT' }, { v: 'error', l: 'E' },
]

export default async function Scorekeeper({ params }: { params: { id: string } }) {
  const uid = currentUid()
  const game = (await query(uid, `select g.*, t.name as team from game g left join team t on t.id=g.team_id where g.id=$1`, [params.id])).rows[0]
  if (!game) return <div className="wrap"><h1>Game not found</h1></div>

  const players = (
    await query(
      uid,
      `select u.id, u.full_name from membership m join app_user u on u.id=m.user_id
       where m.org_id=$1 and m.role='player' order by u.full_name`,
      [game.org_id],
    )
  ).rows

  const box = (
    await query(
      uid,
      `select u.full_name, s.ab,s.h,s.hr,s.rbi,s.bb,s.so,s.r
       from player_game_stat s join app_user u on u.id=s.player_id
       where s.game_id=$1 order by s.rbi desc, s.h desc`,
      [params.id],
    )
  ).rows

  const pas = (await query(uid, `select count(*)::int n from plate_appearance where game_id=$1`, [params.id])).rows[0].n
  const final = game.status === 'final'

  return (
    <div className="wrap">
      <div className="crumb"><a href="/">Dashboard</a> · <a href="/scoring">Scoring</a> · Scorekeeper</div>

      {/* Scoreboard */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--stage)', color: '#fff' }}>
        <div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>{game.team} {game.home ? 'vs' : '@'}</div>
          <div style={{ fontWeight: 800, fontSize: 22 }}>{game.opponent}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 40, lineHeight: 1 }}>{game.us_runs}–{game.them_runs}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>{final ? 'FINAL' : `${game.half} ${game.inning} · ${pas} PA`}</div>
        </div>
      </div>

      {!final && (
        <>
          <div className="section-h">Record plate appearance</div>
          <form action={recordPa} className="card" style={{ display: 'grid', gap: 10 }}>
            <input type="hidden" name="gameId" value={game.id} />
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
              <select name="playerId" required defaultValue="" style={{ padding: 10, border: '1px solid var(--line)', borderRadius: 8 }}>
                <option value="" disabled>Batter…</option>
                {players.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
              <input name="inning" type="number" min={1} defaultValue={game.inning} title="inning" style={{ padding: 10, border: '1px solid var(--line)', borderRadius: 8 }} />
              <input name="rbi" type="number" min={0} defaultValue={0} title="RBI" placeholder="RBI" style={{ padding: 10, border: '1px solid var(--line)', borderRadius: 8 }} />
            </div>
            <input type="hidden" name="half" value="bottom" />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {RESULTS.map((r) => (
                <button key={r.v} name="result" value={r.v} className="btn ghost" style={{ minWidth: 56 }}>{r.l}</button>
              ))}
            </div>
            <div className="m" style={{ color: 'var(--mute)', fontSize: 12 }}>Set batter, inning and RBI, then tap the outcome. HR/hits with RBI raise the score.</div>
          </form>
        </>
      )}

      <div className="section-h">Box score</div>
      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'right', color: 'var(--mute)' }}>
              <th style={{ textAlign: 'left', padding: '4px 6px' }}>Batter</th>
              {['AB', 'H', 'HR', 'RBI', 'BB', 'SO', 'R'].map((h) => <th key={h} style={{ padding: '4px 6px' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {box.map((b, i) => (
              <tr key={i} style={{ textAlign: 'right', borderTop: '1px solid var(--line)' }}>
                <td style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 600 }}>{b.full_name}</td>
                {[b.ab, b.h, b.hr, b.rbi, b.bb, b.so, b.r].map((v, j) => <td key={j} style={{ padding: '4px 6px' }}>{v}</td>)}
              </tr>
            ))}
            {box.length === 0 && <tr><td colSpan={8} style={{ padding: 10, color: 'var(--mute)' }}>No plate appearances yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {!final && (
        <form action={finalizeGame} style={{ marginTop: 14 }}>
          <input type="hidden" name="gameId" value={game.id} />
          <button className="btn">End game (mark final)</button>
        </form>
      )}
    </div>
  )
}
