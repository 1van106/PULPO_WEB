import { json, readJson } from '../../_lib/util.js'
import { getSecret } from '../../_lib/config.js'
import { verifyLicense } from '../../_lib/license.js'

/**
 * POST /api/licenses/verify — verifica una clave de licencia.
 * Es el endpoint que invocaría el agente PULPO al activar su licencia.
 * Body: { token }
 */
export async function onRequestPost({ request, env }) {
  const b = await readJson(request)
  const result = await verifyLicense((b && b.token) || '', getSecret(env))
  return json(result, result.valid ? 200 : 422)
}
