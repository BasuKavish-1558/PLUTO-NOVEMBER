import Dexie from 'dexie'
import { db, SYNCED_TABLES as TABLES, type SyncedTable } from '../db'
import { getSupabase } from '../supabase'

const PAGE = 500

type Row = { id: string; updated_at: string }
type Tombstone = { id: number; table_name: string; row_id: string }

/** Rows with unsent local changes must not be overwritten by older server copies. */
async function pendingRowIds(table: SyncedTable) {
  const entries = await db.outbox
    .where('[table+rowId]')
    .between([table, Dexie.minKey], [table, Dexie.maxKey])
    .toArray()
  return new Set(entries.map((e) => e.rowId))
}

async function pullTombstones() {
  const key = 'cursor:tombstones'
  let cursor = Number((await db.meta.get(key))?.value ?? 0)
  for (;;) {
    const { data, error } = await (await getSupabase())
      .from('sync_tombstones')
      .select('id, table_name, row_id')
      .gt('id', cursor)
      .order('id')
      .limit(PAGE)
    if (error) throw error
    const rows = data as Tombstone[]
    const last = rows.at(-1)
    if (!last) return
    await db.transaction('rw', [...TABLES.map((t) => db.table(t)), db.meta], async () => {
      for (const t of rows) if ((TABLES as string[]).includes(t.table_name)) await db.table(t.table_name).delete(t.row_id)
      await db.meta.put({ key, value: String(last.id) })
    })
    if (rows.length < PAGE) return
    cursor = last.id
  }
}

async function pullTable(table: SyncedTable) {
  const key = `cursor:${table}`
  let cursor = (await db.meta.get(key))?.value ?? '1970-01-01T00:00:00Z'
  for (;;) {
    // gte, not gt: rows sharing the cursor's timestamp are re-read; bulkPut makes that harmless.
    let query = (await getSupabase()).from(table).select('*')
    // Built-in exercises ship with the app; only custom ones sync.
    if (table === 'exercises') query = query.not('user_id', 'is', null)
    const { data, error } = await query
      .gte('updated_at', cursor)
      .order('updated_at')
      .limit(PAGE)
    if (error) throw error
    const rows = data as Row[]
    const last = rows.at(-1)
    if (!last) return
    await db.transaction('rw', db.table(table), db.outbox, db.meta, async () => {
      const pending = await pendingRowIds(table)
      await db.table(table).bulkPut(rows.filter((r) => !pending.has(r.id)))
      await db.meta.put({ key, value: last.updated_at })
    })
    if (rows.length < PAGE || last.updated_at === cursor) return
    cursor = last.updated_at
  }
}

/** The server prunes tombstones after 90 days; a device away longer than this re-downloads everything. */
export const FULL_RESYNC_AFTER_DAYS = 80
const DAY_MS = 86_400_000

/**
 * Starts over from the server: forgets cursors and local copies of synced rows. The outbox (and the
 * rows it still has to send) are kept; the sync cycle pushes before it pulls, so nothing is lost.
 */
async function resetForFullResync() {
  await db.transaction('rw', [...TABLES.map((t) => db.table(t)), db.outbox, db.meta], async () => {
    const pending = new Set((await db.outbox.toArray()).map((e) => `${e.table}:${e.rowId}`))
    for (const table of TABLES) {
      const stale = (await db.table(table).toCollection().primaryKeys()) as string[]
      await db.table(table).bulkDelete(stale.filter((id) => !pending.has(`${table}:${id}`)))
    }
    await db.meta.where('key').startsWith('cursor:').delete()
  })
}

/** Deletes first, so a row deleted and re-created comes back. */
export async function pullAll(now = Date.now()) {
  const last = (await db.meta.get('lastPullAt'))?.value
  if (last && now - Date.parse(last) > FULL_RESYNC_AFTER_DAYS * DAY_MS) await resetForFullResync()
  await pullTombstones()
  for (const table of TABLES) await pullTable(table)
  await db.meta.put({ key: 'lastPullAt', value: new Date(now).toISOString() })
}
