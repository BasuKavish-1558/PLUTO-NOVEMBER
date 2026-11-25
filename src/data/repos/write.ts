import { db, SYNCED_TABLES, type EventType, type SyncedRows, type SyncedTable } from '../db'
import { requestSync } from '../sync/engine'

type NewRow<T extends SyncedTable> = Omit<SyncedRows[T], 'created_at' | 'updated_at'>
type Changes<T extends SyncedTable> = Partial<Omit<SyncedRows[T], 'id' | 'user_id' | 'created_at' | 'updated_at'>>

/**
 * Writes inside commit(): each change lands in Dexie and the outbox together.
 * Timestamps stay out of payloads so the server's updated_at (the sync cursor) is authoritative.
 */
export type Writer = {
  insert<T extends SyncedTable>(table: T, row: NewRow<T>): Promise<void>
  patch<T extends SyncedTable>(table: T, id: string, changes: Changes<T>): Promise<void>
  remove(table: SyncedTable, id: string): Promise<void>
  /** Append-only event (rule 6); createdAt is the device time of the action. */
  event(userId: string, type: EventType, payload: Record<string, unknown>, createdAt: string): Promise<void>
}

const writer: Writer = {
  async insert(table, row) {
    const now = new Date().toISOString()
    await db.table(table).put({ ...row, created_at: now, updated_at: now })
    await db.outbox.add({ op: 'upsert', table, rowId: row.id, payload: { ...row } })
  },
  async patch(table, id, changes) {
    await db.table(table).update(id, { ...changes, updated_at: new Date().toISOString() })
    await db.outbox.add({ op: 'update', table, rowId: id, payload: { ...changes } })
  },
  async remove(table, id) {
    await db.table(table).delete(id)
    await db.outbox.add({ op: 'delete', table, rowId: id })
  },
  async event(userId, type, payload, createdAt) {
    const id = crypto.randomUUID()
    await db.outbox.add({ op: 'insert', table: 'events', rowId: id, payload: { id, user_id: userId, type, payload, created_at: createdAt } })
  },
}

/** One Dexie transaction over every synced table plus outbox, active workout, uploads and meta; then a background sync. */
export async function commit<R>(fn: (w: Writer) => Promise<R>): Promise<R> {
  const tables = [...SYNCED_TABLES.map((t) => db.table(t)), db.outbox, db.activeWorkout, db.pendingUploads, db.meta]
  const result = await db.transaction('rw', tables, () => fn(writer))
  requestSync()
  return result
}
