import { cookies } from 'next/headers'

// Dev auth: no real login. A cookie holds the acting user's id; a switcher in
// the header lets you jump between seeded personas. Swap for Supabase Auth
// (or any provider) later — only this file changes.
export interface DevUser {
  id: string
  name: string
  role: string
}

export const DEV_USERS: DevUser[] = [
  { id: 'a0000000-0000-4000-8000-000000000001', name: 'Adam Rutkowski', role: 'Org Owner' },
  { id: 'a0000000-0000-4000-8000-000000000002', name: 'Jason Roman', role: 'Team Manager / Parent' },
  { id: 'a0000000-0000-4000-8000-000000000004', name: 'Taylor Chen', role: 'New — no org yet' },
]

const COOKIE = 'fuse_uid'

/** The acting user id (defaults to the org owner in dev). */
export function currentUid(): string {
  return cookies().get(COOKIE)?.value ?? DEV_USERS[0].id
}

export function currentUser(): DevUser {
  const uid = currentUid()
  return DEV_USERS.find((u) => u.id === uid) ?? DEV_USERS[0]
}

export const AUTH_COOKIE = COOKIE
