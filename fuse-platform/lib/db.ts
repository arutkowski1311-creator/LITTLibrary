import { Pool, PoolClient, QueryResult } from 'pg'

// One pool across hot reloads in dev.
declare global {
  // eslint-disable-next-line no-var
  var _fusePool: Pool | undefined
}
const pool =
  global._fusePool ??
  new Pool({ connectionString: process.env.DATABASE_URL, max: 8 })
if (process.env.NODE_ENV !== 'production') global._fusePool = pool

/**
 * Run work inside a transaction with the request's user identity set on the
 * session GUC `app.uid`. RLS policies (and the auth.uid() stub) read that GUC,
 * so every query in `fn` is automatically scoped to what this user may see.
 * Pass null for anonymous/public access.
 */
export async function withUser<T>(
  uid: string | null,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('begin')
    if (uid) {
      // is_local = true → scoped to this transaction only.
      await client.query('select set_config($1, $2, true)', ['app.uid', uid])
    }
    const result = await fn(client)
    await client.query('commit')
    return result
  } catch (err) {
    await client.query('rollback')
    throw err
  } finally {
    client.release()
  }
}

/** Convenience: a single scoped query. */
export async function query<R extends Record<string, any> = any>(
  uid: string | null,
  text: string,
  params: any[] = [],
): Promise<QueryResult<R>> {
  return withUser(uid, (c) => c.query<R>(text, params))
}

/** cents → "$1,234.56" */
export function money(cents: number | null | undefined): string {
  const n = (cents ?? 0) / 100
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}
