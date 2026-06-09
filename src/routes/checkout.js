import { Router } from 'express'
import crypto from 'node:crypto'
import { config, DEMO_MODE, PLANS } from '../config.js'
import { stripe } from '../stripe.js'
import { db, queries } from '../db.js'
import { fulfillOrder } from '../fulfill.js'

export const checkoutRouter = Router()

/**
 * POST /api/checkout
 * Body: { plan, billing: "monthly"|"annual", hosts }
 * Crea un pedido y devuelve la URL a la que redirigir (Stripe Checkout
 * o, en modo demo, la página de éxito simulada).
 */
checkoutRouter.post('/checkout', async (req, res) => {
  const { plan = 'pro', billing = 'monthly', hosts = 1 } = req.body || {}
  const planDef = PLANS[plan]

  if (!planDef || !planDef.purchasable) {
    return res.status(400).json({ error: 'Plan no disponible para compra online.' })
  }
  const cycle = billing === 'annual' ? 'annual' : 'monthly'
  const qty = Math.max(1, Math.min(10000, parseInt(hosts, 10) || 1))
  const price = planDef.prices[cycle]

  const orderId = crypto.randomUUID()
  queries.insertOrder.run({
    id: orderId,
    plan,
    billing: cycle,
    hosts: qty,
    email: null,
    status: 'pending',
    stripe_session_id: null,
    created_at: new Date().toISOString()
  })

  // ---- Modo demo: sin Stripe, fulfilla al instante ----
  if (DEMO_MODE) {
    const order = queries.getOrder.get(orderId)
    fulfillOrder(order, { email: null })
    return res.json({ url: `${config.baseUrl}/success.html?order=${orderId}`, demo: true })
  }

  // ---- Stripe Checkout (modo test/producción) ----
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{
        quantity: qty,
        price_data: {
          currency: planDef.currency,
          unit_amount: price.unitAmount,
          recurring: { interval: price.interval },
          product_data: {
            name: `PULPO ${planDef.name}`,
            description: `Licencia ${planDef.name} · ${cycle === 'annual' ? 'anual' : 'mensual'} · por host`
          }
        }
      }],
      subscription_data: planDef.trialDays ? { trial_period_days: planDef.trialDays } : undefined,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      client_reference_id: orderId,
      metadata: { orderId, plan, billing: cycle, hosts: String(qty) },
      success_url: `${config.baseUrl}/success.html?order=${orderId}`,
      cancel_url: `${config.baseUrl}/?status=cancel`
    })

    db.prepare('UPDATE orders SET stripe_session_id = ? WHERE id = ?').run(session.id, orderId)
    return res.json({ url: session.url })
  } catch (err) {
    console.error('[checkout] Stripe error:', err.message)
    return res.status(502).json({ error: 'No se pudo crear la sesión de pago.' })
  }
})

/**
 * GET /api/order/:ref
 * ref = id de pedido (o session_id de Stripe como fallback).
 * Devuelve el estado y, si está pagado, la licencia. Para Stripe, si el
 * webhook aún no llegó, comprueba la sesión y fulfilla si ya está pagada.
 */
checkoutRouter.get('/order/:ref', async (req, res) => {
  const ref = req.params.ref
  let order = queries.getOrder.get(ref) || queries.getOrderBySession.get(ref)
  if (!order) return res.status(404).json({ error: 'Pedido no encontrado.' })

  // Si sigue pendiente y hay Stripe, intenta confirmar contra la sesión.
  if (order.status === 'pending' && !DEMO_MODE && order.stripe_session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id)
      if (session.payment_status === 'paid' || session.status === 'complete') {
        fulfillOrder(order, {
          email: session.customer_details?.email || null,
          stripeCustomerId: session.customer || null
        })
        order = queries.getOrder.get(order.id)
      }
    } catch (err) {
      console.error('[order] Stripe retrieve error:', err.message)
    }
  }

  const out = {
    id: order.id,
    plan: order.plan,
    billing: order.billing,
    hosts: order.hosts,
    status: order.status
  }
  if (order.status === 'paid' && order.license_id) {
    const lic = queries.getLicense.get(order.license_id)
    if (lic) {
      out.license = lic.token
      out.expires_at = lic.expires_at
      out.email = lic.email
    }
  }
  res.json(out)
})
