import express from 'express'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { config, DEMO_MODE, PLANS } from './config.js'
import './db.js' // inicializa el esquema

import { webhookRouter } from './routes/webhook.js'
import { checkoutRouter } from './routes/checkout.js'
import { leadsRouter } from './routes/leads.js'
import { downloadsRouter } from './routes/downloads.js'
import { licensesRouter } from './routes/licenses.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

const app = express()
app.set('trust proxy', true)
app.disable('x-powered-by')

// El webhook de Stripe necesita el cuerpo crudo → va ANTES de express.json().
app.use('/api', webhookRouter)

app.use(express.json({ limit: '64kb' }))

// API REST
app.get('/api/health', (req, res) => {
  res.json({ ok: true, demo: DEMO_MODE, plans: Object.keys(PLANS) })
})
app.use('/api', checkoutRouter)
app.use('/api', leadsRouter)
app.use('/api', downloadsRouter)
app.use('/api', licensesRouter)

// Frontend estático
app.use(express.static(publicDir, { extensions: ['html'] }))

// Cualquier otra ruta → landing (SPA-ish fallback, sin tocar /api)
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' })
  res.sendFile(join(publicDir, 'index.html'))
})

app.listen(config.port, () => {
  console.log(`\n  🐙  PULPO_WEB escuchando en ${config.baseUrl}`)
  console.log(`      Modo: ${DEMO_MODE ? 'DEMO (sin Stripe — pagos simulados)' : 'STRIPE'}`)
  console.log(`      Salud: ${config.baseUrl}/api/health\n`)
})
