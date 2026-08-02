import { query } from '@/lib/db'
import { currentUid } from '@/lib/auth'
import { addVideo } from '../actions'

export const dynamic = 'force-dynamic'

const BUCKETS = [
  { v: 'game', l: 'Game' }, { v: 'practice', l: 'Practice' }, { v: 'interview', l: 'Interview' },
  { v: 'skills', l: 'Skills' }, { v: 'highlight', l: 'Highlight' }, { v: 'other', l: 'Other' },
]
const input = { padding: '9px 11px', border: '1px solid var(--line)', borderRadius: 9, fontSize: 13, background: '#fff' } as const

export default async function VideoPage() {
  const uid = currentUid()
  const org = (await query(uid, 'select id from organization limit 1')).rows[0]
  if (!org) return <div className="wrap"><h1>No organization</h1></div>

  const videos = (
    await query(
      uid,
      `select v.id, v.bucket, v.title, v.url, v.provider, v.visibility, u.full_name as player
       from video_asset v left join app_user u on u.id=v.player_id
       where v.org_id=$1 order by v.created_at desc`,
      [org.id],
    )
  ).rows
  const players = (
    await query(uid, `select u.id, u.full_name from membership m join app_user u on u.id=m.user_id where m.org_id=$1 and m.role='player' order by u.full_name`, [org.id])
  ).rows

  const byBucket: Record<string, any[]> = {}
  for (const v of videos) (byBucket[v.bucket] ??= []).push(v)

  return (
    <div className="wrap">
      <div className="crumb"><a href="/">Dashboard</a> · Video</div>
      <h1>Video library</h1>
      <p className="sub">
        Link video from wherever it already lives — YouTube (unlisted), Hudl, Vimeo, Google Drive. The org organizes and
        controls access; the footage stays on its host. (Native in-app upload can be added later.)
      </p>

      <div className="section-h">Add a video</div>
      <form action={addVideo} className="card" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
        <input name="title" placeholder="Title" style={input} required />
        <select name="bucket" style={input} defaultValue="game">
          {BUCKETS.map((b) => <option key={b.v} value={b.v}>{b.l}</option>)}
        </select>
        <input name="url" placeholder="Paste link (YouTube / Hudl / Vimeo / Drive)" style={{ ...input, gridColumn: '1 / 3' }} required />
        <select name="playerId" style={input} defaultValue="">
          <option value="">Whole team</option>
          {players.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 8 }}>
          <select name="visibility" style={{ ...input, flex: 1 }} defaultValue="org">
            <option value="org">Whole org</option>
            <option value="coaches">Coaches only</option>
            <option value="private">Private (player + uploader)</option>
          </select>
          <button className="btn spark">Add</button>
        </div>
      </form>

      {BUCKETS.filter((b) => (byBucket[b.v] ?? []).length > 0).map((b) => (
        <div key={b.v}>
          <div className="section-h">{b.l} · {(byBucket[b.v] ?? []).length}</div>
          <div className="grid cols-3">
            {(byBucket[b.v] ?? []).map((v) => (
              <a key={v.id} className="card" href={v.url} target="_blank" rel="noopener" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ height: 90, borderRadius: 8, background: 'linear-gradient(135deg, var(--stage), #333)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 26 }}>▶</div>
                <b style={{ fontSize: 14 }}>{v.title}</b>
                <div className="m" style={{ color: 'var(--mute)', fontSize: 12 }}>
                  {v.player ?? 'Team'} · {v.provider}
                  {v.visibility !== 'org' && <span className="pill soon" style={{ marginLeft: 6 }}>{v.visibility === 'coaches' ? 'coaches only' : 'private'}</span>}
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}
      {videos.length === 0 && <div className="card"><span className="m" style={{ color: 'var(--mute)' }}>No videos linked yet.</span></div>}
    </div>
  )
}
