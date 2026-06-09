import Stripe from 'stripe'
import { config, DEMO_MODE } from './config.js'

// En modo demo no se instancia el cliente: el checkout se simula.
export const stripe = DEMO_MODE ? null : new Stripe(config.stripe.secretKey)

export { DEMO_MODE }
