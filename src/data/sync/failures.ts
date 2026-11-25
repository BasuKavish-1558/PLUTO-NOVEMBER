import { db, SYNCED_TABLES, type OutboxEntry, type SyncedTable } from '../db'
import { getSupabase } from '../supabase'

export type SendError = { message: string; code?: string; status?: number }

/**
 * Permanent = retrying can never succeed: the database refused the data itself (invalid value,
 * constraint, row-level security, trigger) or storage refused the file. Everything else
 * (offline, timeouts, expired tokens, 5xx, tables missing because migrations aren't pushed yet)
 * stays queued and is retried.
 */
export function isPermanent(entry: Pick<OutboxEntry, 'table'>, e: SendError): boolean {
  if (/fetch|network|timeout|jwt|token/i.test(e.message)) return false
  if (entry.table === 'storage') return e.status !== undefined && e.status >= 400 && e.status < 500 && e.status !== 408 && e.status !== 429
  return !!e.code && /^(22|23|42501|P0001)/.test(e.code)
}

/** Brings one row back in line with the server after a rejected change: its copy, or gone. */
async function refreshRow(table: SyncedTable, id: string) {
  const { data, error } = await (await getSupabase()).from(table).select('*').eq('id', id).maybeSingle()
  if (error) return // offline again: the next pull will settle it
  if (data) await db.table(table).put(data)
  else await db.table(table).delete(id)
}

/**
 * Moves a rejected change out of the queue into syncFailures (shown in Profile), so one bad row
 * can't block every later change, then restores the server's version of that row locally.
 */
export async function setAside(entry: OutboxEntry, e: SendError) {
  await db.transaction('rw', db.outbox, db.syncFailures, db.pendingUploads, async () => {
    await db.outbox.delete(entry.seq!)
    if (entry.op === 'upload') await db.pendingUploads.delete(entry.rowId)
    await db.syncFailures.add({ table: entry.table, op: entry.op, rowId: entry.rowId, error: e.message, code: e.code, at: new Date().toISOString() })
  })
  if ((SYNCED_TABLES as string[]).includes(entry.table)) await refreshRow(entry.table as SyncedTable, entry.rowId)
}
