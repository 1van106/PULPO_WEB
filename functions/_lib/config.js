// Catálogo de planes y configuración. Los precios Pro son por host (en céntimos).

export const PLANS = {
  community: { id: 'community', name: 'Community', purchasable: false },
  pro: {
    id: 'pro',
    name: 'Pro',
    purchasable: true,
    currency: 'eur',
    trialDays: 14,
    prices: {
      monthly: { unitAmount: 1900, interval: 'month' },
      annual: { unitAmount: 18000, interval: 'year' }
    }
  },
  enterprise: { id: 'enterprise', name: 'Enterprise', purchasable: false }
}

// Los artefactos reales viven en las releases del repo del IDS.
export const RELEASES_URL = 'https://github.com/1van106/PULPO__IDS-IPS/releases'
export const ARTIFACTS = {
  community: { label: 'Community', url: RELEASES_URL },
  pro: { label: 'Pro', url: RELEASES_URL }
}

// Secreto para firmar licencias. En producción, configúralo como secret de Pages:
//   wrangler pages secret put LICENSE_SECRET
export function getSecret(env) {
  return (env && env.LICENSE_SECRET) || 'pulpo-dev-secret-change-me'
}
