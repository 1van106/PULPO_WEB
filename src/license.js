import crypto from 'node:crypto'
import { config } from './config.js'
import { db, queries } from './db.js'

const b64url = (buf) => Buffer.from(buf).toString('base64url')
const fromB64url = (s) => Buffer.from(s, 'base64url')

function sign(payloadB64) {
  return crypto.createHmac('sha256', config.licenseSecret).update(payloadB64).digest('base64url')
}

/**
 * Genera una clave de licencia firmada (HMAC-SHA256) y la persiste.
 * Formato del token: PULPO.<payload_b64url>.<firma_b64url>
 */
export function issueLicense({ plan, hosts = 1, email = null, orderId = null, days = 365 }) {
  const id = crypto.randomUUID()
  const now = new Date()
  const expires = new Date(now.getTime() + days * 86400_000)

  const payload = {
    v: 1,
    id,
    plan,
    hosts: Number(hosts) || 1,
    email,
    iat: Math.floor(now.getTime() / 1000),
    exp: Math.floor(expires.getTime() / 1000)
  }
  const payloadB64 = b64url(JSON.stringify(payload))
  const token = `PULPO.${payloadB64}.${sign(payloadB64)}`

  queries.insertLicense.run({
    id,
    token,
    plan,
    hosts: payload.hosts,
    email,
    order_id: orderId,
    issued_at: now.toISOString(),
    expires_at: expires.toISOString()
  })

  return { id, token, plan, hosts: payload.hosts, email, issuedAt: now.toISOString(), expiresAt: expires.toISOString() }
}

/**
 * Verifica un token de licencia: comprueba la firma, la expiración
 * y el estado en base de datos (revocada / desconocida).
 * Esto es lo que invocaría el agente PULPO al arrancar.
 */
export function verifyLicense(token) {
  if (typeof token !== 'string') return { valid: false, reason: 'malformed' }
  const parts = token.split('.')
  if (parts.length !== 3 || parts[0] !== 'PULPO') return { valid: false, reason: 'malformed' }

  const [, payloadB64, sig] = parts
  const expected = sign(payloadB64)
  // Comparación en tiempo constante
  const a = fromB64url(sig)
  const b = fromB64url(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { valid: false, reason: 'bad_signature' }
  }

  let payload
  try {
    payload = JSON.parse(fromB64url(payloadB64).toString('utf8'))
  } catch {
    return { valid: false, reason: 'malformed' }
  }

  const now = Math.floor(Date.now() / 1000)
  if (payload.exp && now > payload.exp) return { valid: false, reason: 'expired', payload }

  const row = db.prepare('SELECT status FROM licenses WHERE id = ?').get(payload.id)
  if (!row) return { valid: false, reason: 'unknown', payload }
  if (row.status !== 'active') return { valid: false, reason: 'revoked', payload }

  return {
    valid: true,
    plan: payload.plan,
    hosts: payload.hosts,
    email: payload.email,
    expiresAt: new Date(payload.exp * 1000).toISOString()
  }
}
