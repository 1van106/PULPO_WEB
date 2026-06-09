import { json, readJson } from '../_lib/util.js'
import { hasDB, ensureSchema, saveLead } from '../_lib/store.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * POST /api/leads — captación de leads del plan Enterprise.
 * Body: { name, email, company, hosts, message }
 */
export async function onRequestPost({ request, env }) {
  const b = await readJson(request)
  const name = String(b.name || '').trim()
  const email = String(b.email || '').trim()
  const company = String(b.company || '').trim() || null
  const message = String(b.message || '').trim() || null
  const hostsRaw = b.hosts != null ? String(b.hosts).trim() : ''
  const hosts = hostsRaw !== '' && Number.isFinite(parseInt(hostsRaw, 10)) ? parseInt(hostsRaw, 10) : null

  if (!name || name.length > 120) return json({ error: 'Nombre no válido.' }, 400)
  if (!EMAIL_RE.test(email)) return json({ error: 'Email no válido.' }, 400)

  const id = crypto.randomUUID()
  const ref = 'PULPO-' + id.slice(0, 8).toUpperCase()

  if (hasDB(env)) {
    await ensureSchema(env.DB)
    await saveLead(env.DB, { id, ref, name, email, company, hosts, message, created_at: new Date().toISOString() })
  }

  return json({ ok: true, ref })
}
