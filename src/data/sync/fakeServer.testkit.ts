/** Test-only stand-in for the Supabase client: records every call as a readable string. */
export const server = {
  calls: [] as string[],
  failOn: null as string | null,
  failMessage: 'boom',
  failCode: undefined as string | undefined,
  rows: {} as Record<string, unknown[]>,
  reset() {
    this.calls = []
    this.failOn = null
    this.failMessage = 'boom'
    this.failCode = undefined
    this.rows = {}
  },
}

const result = (label: string) => {
  server.calls.push(label)
  return Promise.resolve({ error: server.failOn === label ? { message: server.failMessage, code: server.failCode } : null })
}

const select = (table: string) => {
  const done = () => Promise.resolve({ data: server.rows[table] ?? [], error: null })
  let id: string | undefined
  const chain = {
    not: () => chain,
    gte: () => chain,
    gt: () => chain,
    order: () => chain,
    limit: done,
    eq: (_: string, value: string) => ((id = value), chain),
    maybeSingle: () =>
      Promise.resolve({ data: (server.rows[table] as { id: string }[] | undefined)?.find((r) => r.id === id) ?? null, error: null }),
  }
  return chain
}

const client = {
  from: (table: string) => ({
    upsert: (p: { id: string }, opts?: { ignoreDuplicates?: boolean }) =>
      result(`${opts?.ignoreDuplicates ? 'insert' : 'upsert'} ${table} ${p.id}`),
    update: () => ({ eq: (_: string, id: string) => result(`update ${table} ${id}`) }),
    delete: () => ({ eq: (_: string, id: string) => result(`delete ${table} ${id}`) }),
    select: () => select(table),
  }),
  storage: {
    from: () => ({
      upload: (path: string) => result(`upload ${path}`),
      remove: ([path]: string[]) => result(`remove ${path}`),
    }),
  },
}

/** Use as: vi.mock('../supabase', async () => (await import('./fakeServer.testkit')).supabaseModule) */
export const supabaseModule = { getSupabase: () => client, supabaseConfigured: true }
