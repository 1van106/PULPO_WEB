import { json } from '../../_lib/util.js'
import { ARTIFACTS } from '../../_lib/config.js'
import { hasDB, ensureSchema, logDownload } from '../../_lib/store.js'

/**
 * POST /api/download/:plan — registra la descarga y devuelve la URL del
 * artefacto (página de releases del IDS).
 */
export async function onRequestPost({ params, request, env }) {
  const plan = params.plan
  const artifact = ARTIFACTS[plan]
  if (!artifact) return json({ error: 'No hay descarga para ese plan.' }, 404)

  if (hasDB(env)) {
    await ensureSchema(env.DB)
    await logDownload(env.DB, {
      plan,
      ip: request.headers.get('cf-connecting-ip'),
      userAgent: request.headers.get('user-agent')
    })
  }

  return json({ ok: true, plan, url: artifact.url })
}
