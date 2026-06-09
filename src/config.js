import 'dotenv/config'

const int = (v, def) => {
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : def
}

export const config = {
  port: int(process.env.PORT, 3000),
  baseUrl: (process.env.BASE_URL || `http://localhost:${int(process.env.PORT, 3000)}`).replace(/\/$/, ''),
  licenseSecret: process.env.LICENSE_SECRET || 'pulpo-dev-secret-change-me',
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ''
  },
  proTrialDays: int(process.env.PRO_TRIAL_DAYS, 14)
}

// ¿Hay Stripe configurado? Si no, el backend funciona en modo demo.
export const DEMO_MODE = !config.stripe.secretKey

// Catálogo de planes. Los precios Pro son por host.
export const PLANS = {
  community: {
    id: 'community',
    name: 'Community',
    purchasable: false,         // descarga directa, sin pago
    artifact: 'community'
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    purchasable: true,
    artifact: 'pro',
    currency: 'eur',
    trialDays: config.proTrialDays,
    prices: {
      monthly: { unitAmount: int(process.env.PRICE_PRO_MONTHLY, 1900), interval: 'month' },
      annual:  { unitAmount: int(process.env.PRICE_PRO_ANNUAL, 18000), interval: 'year' }
    }
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    purchasable: false,         // solo vía contacto de ventas
    artifact: null
  }
}

// Artefactos de descarga disponibles por plan (placeholders para el portfolio).
export const ARTIFACTS = {
  community: { file: 'PULPO-community-2.4.0.AppImage', label: 'Community' },
  pro:       { file: 'PULPO-pro-2.4.0.AppImage', label: 'Pro' }
}
