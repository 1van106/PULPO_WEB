import { json, readJson } from '../_lib/util.js'
import { PLANS, getSecret } from '../_lib/config.js'
import { issueLicense } from '../_lib/license.js'
import { hasDB, ensureSchema, saveOrderPaid } from '../_lib/store.js'

/**
 * POST /api/checkout — checkout en modo demo (sin cobro real).
 * Body: { plan, billing: "monthly"|"annual", hosts }
 * Emite una licencia firmada y devuelve la URL de la página de éxito.
 */
export async function onRequestPost({ request, env }) {
  const body = await readJson(request)
  const plan = body.plan || 'pro'
  const billing = body.billing === 'annual' ? 'annual' : 'monthly'
  const hosts = Math.max(1, Math.min(10000, parseInt(body.hosts, 10) || 1))

  const planDef = PLANS[plan]
  if (!planDef || !planDef.purchasable) {
    return json({ error: 'Plan no disponible para compra online.' }, 400)
  }

  const days = billing === 'annual' ? 365 : 30
  const license = await issueLicense({ plan, hosts, days, secret: getSecret(env) })
  const orderId = crypto.randomUUID()
  const origin = new URL(request.url).origin

  // Con D1: persistimos pedido + licencia y mandamos a /success.html?order=<id>
  if (hasDB(env)) {
    await ensureSchema(env.DB)
    await saveOrderPaid(env.DB, { orderId, plan, billing, hosts, license })
    return json({ url: `${origin}/success?order=${orderId}`, demo: true })
  }

  // Sin D1 (sin estado): entregamos la licencia por la URL de éxito.
  const q = new URLSearchParams({
    order: orderId,
    token: license.token,
    plan,
    hosts: String(hosts),
    billing,
    exp: license.expiresAt
  })
  return json({ url: `${origin}/success?${q.toString()}`, demo: true })
}
