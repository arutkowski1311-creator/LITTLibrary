import './globals.css'
import type { Metadata } from 'next'
import { DEV_USERS, currentUid } from '@/lib/auth'
import { setUser } from './actions'

export const metadata: Metadata = {
  title: 'Fuse — Platform',
  description: 'The youth-sports operating system.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const uid = currentUid()
  return (
    <html lang="en">
      <body>
        <div className="topbar">
          <a href="/" style={{ textDecoration: 'none' }}>
            <span className="wm"><b>f</b>use</span>
          </a>
          <form action={setUser} className="who">
            <span>Acting as</span>
            <select name="uid" defaultValue={uid} onChange={undefined}>
              {DEV_USERS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} · {u.role}
                </option>
              ))}
            </select>
            <button className="btn ghost" style={{ padding: '6px 10px', color: '#fff', borderColor: '#333' }}>
              Switch
            </button>
          </form>
        </div>
        {children}
      </body>
    </html>
  )
}
