import { Router } from 'express'
import { verifyLicense } from '../license.js'

export const licensesRouter = Router()

/**
 * POST /api/licenses/verify — verifica una clave de licencia.
 * Es el endpoint que invocaría el agente PULPO al activar su licencia.
 * Body: { token }
 */
licensesRouter.post('/licenses/verify', (req, res) => {
  const token = (req.body && req.body.token) || ''
  const result = verifyLicense(token)
  res.status(result.valid ? 200 : 422).json(result)
})
