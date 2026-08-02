import { query } from '@/lib/db'
import { currentUid } from '@/lib/auth'
import { logWorkout } from '../actions'

export const dynamic = 'force-dynamic'

export default async function TrainingPage() {
  const uid = currentUid()
  const org = (await query(uid, 'select id from organization limit 1')).rows[0]
  if (!org) return <div className="wrap"><h1>No organization</h1></div>

  const assignments = (
    await query(
      uid,
      `select a.id, a.player_id, a.due_date, w.name, w.category, u.full_name as player,
              (select count(*) from workout_log l where l.assignment_id=a.id) as logs,
              (select notes from workout_log l where l.assignment_id=a.id order by logged_on desc limit 1) as last_note
       from workout_assignment a
       join workout w on w.id=a.workout_id
       left join app_user u on u.id=a.player_id
       where a.org_id=$1 order by a.due_date`,
      [org.id],
    )
  ).rows

  const workouts = (await query(uid, 'select name, category, description from workout where org_id=$1 order by category, name', [org.id])).rows
  const done = assignments.filter((a) => Number(a.logs) > 0).length

  return (
    <div className="wrap">
      <div className="crumb"><a href="/">Dashboard</a> · Training</div>
      <h1>Training</h1>
      <p className="sub">Coach-assigned workouts with player logging — completions feed Athletic Capacity in the RAW index.</p>

      <div className="section-h">Assignments · {done}/{assignments.length} logged</div>
      <div className="list">
        {assignments.map((a) => {
          const logged = Number(a.logs) > 0
          return (
            <div key={a.id} className="row">
              <div>
                <div className="n">{a.name} <span className="pill soon" style={{ marginLeft: 6 }}>{a.category}</span></div>
                <div className="m">{a.player ?? 'Team'} · due {a.due_date ? new Date(a.due_date).toLocaleDateString() : '—'}{a.last_note ? ` · “${a.last_note}”` : ''}</div>
              </div>
              {logged ? (
                <span className="pill live">logged</span>
              ) : (
                <form action={logWorkout} style={{ display: 'flex', gap: 6 }}>
                  <input type="hidden" name="assignmentId" value={a.id} />
                  <input type="hidden" name="playerId" value={a.player_id ?? ''} />
                  <input name="notes" placeholder="How’d it go?" style={{ padding: '7px 9px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12, width: 160 }} />
                  <button className="btn ghost" style={{ fontSize: 12 }}>Log done</button>
                </form>
              )}
            </div>
          )
        })}
        {assignments.length === 0 && <div className="card"><span className="m" style={{ color: 'var(--mute)' }}>No assignments yet.</span></div>}
      </div>

      <div className="section-h">Workout library</div>
      <div className="grid cols-3">
        {workouts.map((w, i) => (
          <div key={i} className="card">
            <b>{w.name}</b>
            <div className="m" style={{ color: 'var(--mute)', fontSize: 12, margin: '2px 0 6px' }}>{w.category}</div>
            <div style={{ fontSize: 13 }}>{w.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
