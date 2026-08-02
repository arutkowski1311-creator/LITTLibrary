// Reset + migrate + seed the LOCAL dev database. One command: `npm run db:reset`.
// Connects as the admin (superuser) role; drops and rebuilds public + auth so
// the result is fully reproducible, then applies stubs, every migration in
// order, the dev role, and the seed. Never point this at production.
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const admin = process.env.DATABASE_URL_ADMIN || 'postgres://postgres:postgres@localhost:5432/fuse'

const migrations = readdirSync(join(root, 'supabase', 'migrations'))
  .filter((f) => f.endsWith('.sql'))
  .sort()

const files = [
  join(root, 'db', '00_stubs.sql'),
  ...migrations.map((f) => join(root, 'supabase', 'migrations', f)),
  join(root, 'db', '10_dev_role.sql'),
  join(root, 'db', 'seed.sql'),
]

const client = new pg.Client({ connectionString: admin })
await client.connect()

console.log('resetting schemas...')
await client.query('drop schema if exists public cascade; create schema public;')
await client.query('drop schema if exists auth cascade;')
await client.query('grant all on schema public to public;')

for (const f of files) {
  process.stdout.write(`  ${f.replace(root + '/', '')} ... `)
  await client.query(readFileSync(f, 'utf8'))
  console.log('ok')
}

await client.end()
console.log('done — local database reset, migrated, and seeded.')
