// Emisión y verificación de licencias firmadas (HMAC-SHA256 vía Web Crypto).
// Las licencias son autocontenidas: el agente PULPO puede verificarlas offline.

import { b64urlFromBytes, b64urlFromString, stringFromB64url } from './util.js'

async function importKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

async function sign(secret, data) {
  const key = await importKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return b64urlFromBytes(new Uint8Array(sig))
}

/**
 * Genera una clave de licencia firmada.
 * Token: PULPO.<payload_b64url>.<firma_b64url>
 */
export async function issueLicense({ plan, hosts = 1, email = null, days = 365, secret }) {
  const id = crypto.randomUUID()
  const now = new Date()
  const exp = new Date(now.getTime() + days * 86400000)
  const payload = {
    v: 1,
    id,
    plan,
    hosts: Number(hosts) || 1,
    email,
    iat: Math.floor(now.getTime() / 1000),
    exp: Math.floor(exp.getTime() / 1000)
  }
  const payloadB64 = b64urlFromString(JSON.stringify(payload))
  const token = `PULPO.${payloadB64}.${await sign(secret, payloadB64)}`
  return {
    id,
    token,
    plan,
    hosts: payload.hosts,
    email,
    issuedAt: now.toISOString(),
    expiresAt: exp.toISOString()
  }
}

/**
 * Verifica firma y expiración de un token de licencia.
 * (HMAC es determinista, así que comparar las firmas es seguro.)
 */
export async function verifyLicense(token, secret) {
  if (typeof token !== 'string') return { valid: false, reason: 'malformed' }
  const parts = token.split('.')
  if (parts.length !== 3 || parts[0] !== 'PULPO') return { valid: false, reason: 'malformed' }

  const [, payloadB64, sig] = parts
  const expected = await sign(secret, payloadB64)
  if (sig.length !== expected.length) return { valid: false, reason: 'bad_signature' }
  let diff = 0
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i)
  if (diff !== 0) return { valid: false, reason: 'bad_signature' }

  let payload
  try {
    payload = JSON.parse(stringFromB64url(payloadB64))
  } catch {
    return { valid: false, reason: 'malformed' }
  }

  const now = Math.floor(Date.now() / 1000)
  if (payload.exp && now > payload.exp) return { valid: false, reason: 'expired', payload }

  return {
    valid: true,
    plan: payload.plan,
    hosts: payload.hosts,
    email: payload.email,
    expiresAt: new Date(payload.exp * 1000).toISOString()
  }
}
