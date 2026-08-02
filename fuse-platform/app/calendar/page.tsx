import { query } from '@/lib/db'
import { currentUid } from '@/lib/auth'
import { addScheduleEvent, setRsvp } from '../actions'

export const dynamic = 'force-dynamic'

const input = { padding: '9px 11px', border: '1px solid var(--line)', borderRadius: 9, fontSize: 13, background: '#fff' } as const
const TYPE_LABEL: Record<string, string> = { game: 'Game', practice: 'Practice', tournament: 'Tournament', meeting: 'Meeting', team_event: 'Event', other: 'Event', training: 'Training' }

export default async function CalendarPage() {
  const uid = currentUid()
  const org = (await query(uid, 'select id from organization limit 1')).rows[0]
  if (!org) return <div className="wrap"><h1>No organization</h1></div>

  const games = (await query(uid, `select id, opponent, starts_at, location, home, status from game where org_id=$1`, [org.id])).rows
  const events = (await query(uid, `select id, type, title, starts_at, location from schedule_event where org_id=$1`, [org.id])).rows
  const training = (
    await query(
      uid,
      `select a.id, w.name, a.due_date, u.full_name as player
       from workout_assignment a join workout w on w.id=a.workout_id
       left join app_user u on u.id=a.player_id where a.org_id=$1 and a.due_date is not null`,
      [org.id],
    )
  ).rows

  // RSVP summaries + the acting user's own choice.
  const counts = (
    await query(
      uid,
      `select coalesce(schedule_event_id::text, game_id::text) as ref, status, count(*)::int n
       from rsvp where org_id=$1 group by 1,2`,
      [org.id],
    )
  ).rows
  const mine = (
    await query(uid, `select coalesce(schedule_event_id::text, game_id::text) as ref, status from rsvp where org_id=$1 and user_id=$2`, [org.id, uid])
  ).rows
  const countBy: Record<string, Record<string, number>> = {}
  for (const c of counts) (countBy[c.ref] ??= {})[c.status] = Number(c.n)
  const myBy: Record<string, string> = {}
  for (const m of mine) myBy[m.ref] = m.status

  type Item = { when: number; kind: 'game' | 'event' | 'training'; refId: string; type: string; title: string; location?: string; rsvpable: boolean }
  const items: Item[] = [
    ...games.map((g) => ({ when: +new Date(g.starts_at), kind: 'game' as const, refId: g.id, type: 'game', title: `${g.home ? 'vs' : '@'} ${g.opponent}`, location: g.location, rsvpable: g.status !== 'final' })),
    ...events.map((e) => ({ when: +new Date(e.starts_at), kind: 'event' as const, refId: e.id, type: e.type, title: e.title, location: e.location, rsvpable: true })),
    ...training.map((t) => ({ when: +new Date(t.due_date), kind: 'training' as const, refId: t.id, type: 'training', title: `${t.name}${t.player ? ` · ${t.player}` : ''}`, location: 'Assigned', rsvpable: false })),
  ].sort((a, b) => a.when - b.when)

  return (
    <div className="wrap">
      <div className="crumb"><a href="/">Dashboard</a> · Calendar</div>
      <h1>Team calendar</h1>
      <p className="sub">Games, practices, tournaments and training in one timeline. Tap to RSVP.</p>

      <div className="section-h">Add to schedule</div>
      <form action={addScheduleEvent} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <input name="title" placeholder="Title (e.g. Saturday Practice)" style={{ ...input, gridColumn: '1 / 3' }} required />
        <select name="type" style={input} defaultValue="practice">
          <option value="practice">Practice</option>
          <option value="tournament">Tournament</option>
          <option value="meeting">Meeting</option>
          <option value="team_event">Team event</option>
        </select>
        <input name="starts_at" type="datetime-local" style={input} required />
        <input name="location" placeholder="Location" style={input} />
        <button className="btn spark">Add</button>
      </form>

      <div className="section-h">Timeline</div>
      <div className="list">
        {items.map((it, i) => {
          const c = countBy[it.refId] ?? {}
          const my = myBy[it.refId]
          const d = new Date(it.when)
          return (
            <div key={i} className="row" style={{ alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ textAlign: 'center', minWidth: 44 }}>
                  <div style={{ fontSize: 11, color: 'var(--mute)', textTransform: 'uppercase' }}>{d.toLocaleString('en-US', { month: 'short' })}</div>
                  <div style={{ fontWeight: 800, fontSize: 20, lineHeight: 1 }}>{d.getDate()}</div>
                </div>
                <div>
                  <div className="n">{it.title} <span className="pill soon" style={{ marginLeft: 4 }}>{TYPE_LABEL[it.type] ?? it.type}</span></div>
                  <div className="m">{d.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}{it.location ? ` · ${it.location}` : ''}
                    {it.rsvpable && ((c.yes || 0) + (c.maybe || 0) + (c.no || 0) > 0) ? ` · ${c.yes || 0} in, ${c.maybe || 0} maybe, ${c.no || 0} out` : ''}
                  </div>
                </div>
              </div>
              {it.rsvpable && (
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['yes', 'maybe', 'no'] as const).map((s) => (
                    <form key={s} action={setRsvp}>
                      <input type="hidden" name="kind" value={it.kind} />
                      <input type="hidden" name="refId" value={it.refId} />
                      <input type="hidden" name="status" value={s} />
                      <button className={`btn ${my === s ? 'spark' : 'ghost'}`} style={{ padding: '5px 10px', fontSize: 12, textTransform: 'capitalize' }}>{s}</button>
                    </form>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {items.length === 0 && <div className="card"><span className="m" style={{ color: 'var(--mute)' }}>Nothing scheduled yet.</span></div>}
      </div>
    </div>
  )
}
