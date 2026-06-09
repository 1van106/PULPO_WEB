import { Router } from 'express'
import express from 'express'
import { config, DEMO_MODE } from '../config.js'
import { stripe } from '../stripe.js'
import { queries } from '../db.js'
import { fulfillOrder } from '../fulfill.js'

export const webhookRouter = Router()

/**
 * POST /api/webhook  — eventos de Stripe.
 * Requiere el cuerpo crudo (raw) para verificar la firma, por eso usa
 * su propio body parser y debe montarse ANTES de express.json().
 */
webhookRouter.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  if (DEMO_MODE) return res.json({ received: true, demo: true })

  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], config.stripe.webhookSecret)
  } catch (err) {
    console.error('[webhook] firma inválida:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const orderId = session.client_reference_id || session.metadata?.orderId
    const order = orderId ? queries.getOrder.get(orderId) : queries.getOrderBySession.get(session.id)
    if (order) {
      fulfillOrder(order, {
        email: session.customer_details?.email || null,
        stripeCustomerId: session.customer || null
      })
      console.log(`[webhook] pedido ${order.id} fulfillado`)
    }
  }

  res.json({ received: true })
})
