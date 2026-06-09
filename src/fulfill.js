import { queries } from './db.js'
import { issueLicense } from './license.js'

/**
 * Marca un pedido como pagado y emite su licencia. Idempotente:
 * si el pedido ya está pagado, devuelve la licencia existente.
 * Lo usan el checkout en modo demo, el webhook de Stripe y el polling
 * de la página de éxito.
 */
export function fulfillOrder(order, { email = null, stripeCustomerId = null } = {}) {
  if (order.status === 'paid' && order.license_id) {
    return queries.getLicense.get(order.license_id)
  }

  const days = order.billing === 'annual' ? 365 : 30
  const license = issueLicense({
    plan: order.plan,
    hosts: order.hosts,
    email: email || order.email,
    orderId: order.id,
    days
  })

  queries.markOrderPaid.run({
    id: order.id,
    paid_at: new Date().toISOString(),
    license_id: license.id,
    stripe_customer_id: stripeCustomerId,
    email: email || order.email
  })

  return queries.getLicense.get(license.id)
}
