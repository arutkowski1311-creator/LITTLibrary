import './globals.css'
import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { DEV_USERS, currentUid } from '@/lib/auth'
import { query } from '@/lib/db'
import { setUser } from './actions'

export const metadata: Metadata = {
  title: 'Fuse — Platform',
  description: 'The youth-sports operating system.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const uid = currentUid()
  const org = (
    await query(uid, 'select public_name, brand_primary, brand_accent from organization limit 1')
  ).rows[0]

  const primary = org?.brand_primary || '#F6A93B'
  const accent = org?.brand_accent || '#FF6A2B'
  // Org brand themes the content area; the Fuse wordmark stays platform chrome.
  const brandVars = { ['--fuse' as any]: primary, ['--spark' as any]: accent } as CSSProperties

  return (
    <html lang="en">
      <body>
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <a href="/" style={{ textDecoration: 'none' }}>
              <span className="wm"><b>f</b>use</span>
            </a>
            {org && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#fff',
                  padding: '3px 10px',
                  borderRadius: 999,
                  background: primary,
                  boxShadow: `inset 0 0 0 1px rgba(255,255,255,.25)`,
                }}
              >
                {org.public_name}
              </span>
            )}
          </div>
          <form action={setUser} className="who">
            <span>Acting as</span>
            <select name="uid" defaultValue={uid}>
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
        <div style={{ height: 4, background: `linear-gradient(90deg, ${primary}, ${accent})` }} />
        <div style={brandVars}>{children}</div>
      </body>
    </html>
  )
}
