import { describe, expect, it } from 'vitest'

/** Static guard over the SQL migrations: no table may ship without row-level security. */
const files = import.meta.glob('../../supabase/migrations/*.sql', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const sql = Object.keys(files)
  .sort()
  .map((k) => files[k]!)
  .join('\n')
  .toLowerCase()

const tables = [...sql.matchAll(/create table public\.(\w+)/g)].map((m) => m[1]!)
const loopTables = [...sql.matchAll(/array\[([^\]]+)\] loop/g)].flatMap((m) => [...m[1]!.matchAll(/'(\w+)'/g)].map((x) => x[1]!))

describe('row-level security in migrations', () => {
  it('finds the expected tables', () => {
    expect(tables).toEqual(expect.arrayContaining(['profiles', 'workouts', 'set_logs', 'events', 'personal_records', 'nutrition_entries']))
    expect(tables.length).toBeGreaterThanOrEqual(16)
  })

  it.each(tables)('%s has RLS enabled and at least one policy', (t) => {
    const direct = sql.includes(`alter table public.${t} enable row level security`)
    const inLoop = loopTables.includes(t) && sql.includes(`alter table public.%i enable row level security`)
    expect(direct || inLoop).toBe(true)
    expect(sql.includes(`on public.${t}`) || inLoop).toBe(true)
  })

  it('scopes every policy to signed-in users and checks ownership on writes', () => {
    const policies = [...sql.matchAll(/create policy "[^"]+" on [\w.%$1i]+([^;]*);/g)].map((m) => m[1]!)
    expect(policies.length).toBeGreaterThan(10)
    for (const p of policies) {
      expect(p).toContain('to authenticated')
      if (/for (insert|update|all)/.test(p)) expect(p).toContain('with check')
    }
  })

  it('keeps events append-only', () => {
    expect(sql).toContain('revoke update, delete on public.events from authenticated, anon')
    expect(sql).not.toMatch(/create policy "[^"]+" on public\.events for (update|delete|all)/)
  })

  it('keeps the media bucket private', () => {
    expect(sql).toMatch(/values \('user-media', 'user-media', false/)
  })
})
