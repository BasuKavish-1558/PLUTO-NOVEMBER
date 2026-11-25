import { parseLocalDate, toLocalDate, type LocalDate } from '@/domain/dates'
import { db, type BodyVital } from '../db'
import { requestSync } from '../sync/engine'

const payloadOf = ({ id, user_id, measured_at, local_date, weight_kg }: BodyVital) => ({
  id,
  user_id,
  measured_at,
  local_date,
  weight_kg,
})

async function save(row: BodyVital) {
  await db.transaction('rw', db.body_vitals, db.outbox, async () => {
    await db.body_vitals.put(row)
    await db.outbox.add({ op: 'upsert', table: 'body_vitals', rowId: row.id, payload: payloadOf(row) })
  })
  requestSync()
}

/** Today's entry gets the current time; a back-dated entry is placed at local noon of that day. */
export async function addWeight(userId: string, weightKg: number, localDate: LocalDate, now = new Date()) {
  const measured_at = localDate === toLocalDate(now) ? now.toISOString() : parseLocalDate(localDate).toISOString()
  const stamp = now.toISOString()
  const row: BodyVital = {
    id: crypto.randomUUID(),
    user_id: userId,
    measured_at,
    local_date: localDate,
    weight_kg: weightKg,
    created_at: stamp,
    updated_at: stamp,
  }
  await save(row)
  return row
}

export async function deleteWeight(id: string) {
  await db.transaction('rw', db.body_vitals, db.outbox, async () => {
    await db.body_vitals.delete(id)
    await db.outbox.add({ op: 'delete', table: 'body_vitals', rowId: id })
  })
  requestSync()
}

/** Undo for deleteWeight: same id, so other devices converge. */
export const restoreWeight = (row: BodyVital) => save({ ...row, updated_at: new Date().toISOString() })
