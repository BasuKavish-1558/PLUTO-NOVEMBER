// Deletes the caller's storage files and auth user. Every table cascades from auth.users.
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

const BUCKET = 'user-media'
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

async function listFiles(admin: SupabaseClient, prefix: string): Promise<string[]> {
  const files: string[] = []
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await admin.storage.from(BUCKET).list(prefix, { limit: 1000, offset })
    if (error) throw error
    for (const item of data) {
      const path = `${prefix}/${item.name}`
      // Folders come back with a null id.
      if (item.id === null) files.push(...(await listFiles(admin, path)))
      else files.push(path)
    }
    if (data.length < 1000) return files
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'unauthorized' }, 401)

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })
  const { data: { user }, error: authError } = await admin.auth.getUser(token)
  if (authError || !user) return json({ error: 'unauthorized' }, 401)

  try {
    const files = await listFiles(admin, user.id)
    for (let i = 0; i < files.length; i += 1000) {
      const { error } = await admin.storage.from(BUCKET).remove(files.slice(i, i + 1000))
      if (error) throw error
    }
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
    if (deleteError) throw deleteError
    await admin.from('sync_tombstones').delete().eq('user_id', user.id)
    return json({ ok: true })
  } catch (error) {
    console.error('delete-account failed', error)
    return json({ error: 'delete_failed' }, 500)
  }
})
