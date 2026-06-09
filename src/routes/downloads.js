import { Router } from 'express'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync } from 'node:fs'
import { ARTIFACTS } from '../config.js'
import { queries } from '../db.js'

export const downloadsRouter = Router()

const __dirname = dirname(fileURLToPath(import.meta.url))
const downloadsDir = join(__dirname, '..', '..', 'downloads')

/**
 * POST /api/download/:plan — registra la descarga y devuelve la URL del fichero.
 */
downloadsRouter.post('/download/:plan', (req, res) => {
  const plan = req.params.plan
  const artifact = ARTIFACTS[plan]
  if (!artifact) return res.status(404).json({ error: 'No hay descarga para ese plan.' })

  queries.insertDownload.run({
    plan,
    artifact: artifact.file,
    ip: req.ip,
    user_agent: req.get('user-agent') || null,
    created_at: new Date().toISOString()
  })

  res.json({ ok: true, plan, file: artifact.file, url: `/api/download/file/${plan}` })
})

/**
 * GET /api/download/file/:plan — sirve el binario (o un placeholder si aún
 * no se ha publicado el artefacto real, para que el flujo sea demostrable).
 */
downloadsRouter.get('/download/file/:plan', (req, res) => {
  const plan = req.params.plan
  const artifact = ARTIFACTS[plan]
  if (!artifact) return res.status(404).json({ error: 'No hay descarga para ese plan.' })

  const filePath = join(downloadsDir, artifact.file)
  if (existsSync(filePath)) {
    return res.download(filePath, artifact.file)
  }

  // Placeholder descargable: script de instalación de muestra.
  const stub = `#!/usr/bin/env bash
# PULPO ${artifact.label} — instalador (placeholder de demostración)
# El artefacto real (${artifact.file}) se publica en la página de releases.
set -euo pipefail
echo "Instalando PULPO ${artifact.label}..."
echo "Descarga el binario real desde: https://github.com/1van106/PULPO__IDS-IPS/releases"
`
  res.setHeader('Content-Type', 'application/x-sh')
  res.setHeader('Content-Disposition', `attachment; filename="install-pulpo-${plan}.sh"`)
  res.send(stub)
})
