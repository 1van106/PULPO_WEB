import { Router } from 'express'
import crypto from 'node:crypto'
import { queries } from '../db.js'

export const leadsRouter = Router()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * POST /api/leads — captación de leads del plan Enterprise.
 * Body: { name, email, company, hosts, message }
 */
leadsRouter.post('/leads', (req, res) => {
  const b = req.body || {}
  const name = String(b.name || '').trim()
  const email = String(b.email || '').trim()
  const company = String(b.company || '').trim() || null
  const message = String(b.message || '').trim() || null
  const hosts = b.hosts != null && String(b.hosts).trim() !== '' ? parseInt(b.hosts, 10) : null

  if (!name || name.length > 120) return res.status(400).json({ error: 'Nombre no válido.' })
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Email no válido.' })

  const id = crypto.randomUUID()
  const ref = 'PULPO-' + id.slice(0, 8).toUpperCase()
  queries.insertLead.run({
    id,
    ref,
    name,
    email,
    company,
    hosts: Number.isFinite(hosts) ? hosts : null,
    message,
    created_at: new Date().toISOString()
  })

  console.log(`[lead] ${ref} — ${name} <${email}>${company ? ' · ' + company : ''}`)
  res.json({ ok: true, ref })
})
