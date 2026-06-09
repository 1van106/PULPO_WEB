// Utilidades compartidas para las Pages Functions (runtime Workers).

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  })
}

export async function readJson(request) {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

// ---- base64url <-> bytes/string (Workers no tiene Buffer) ----
export function b64urlFromBytes(bytes) {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function b64urlToBytes(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = str.length % 4 ? 4 - (str.length % 4) : 0
  str += '='.repeat(pad)
  const bin = atob(str)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export const b64urlFromString = (s) => b64urlFromBytes(new TextEncoder().encode(s))
export const stringFromB64url = (s) => new TextDecoder().decode(b64urlToBytes(s))
