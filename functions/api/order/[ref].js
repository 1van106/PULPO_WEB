import { json } from '../../_lib/util.js'
import { hasDB, getOrderWithLicense } from '../../_lib/store.js'

/**
 * GET /api/order/:ref — estado del pedido y, si está pagado, su licencia.
 * Solo aplica cuando D1 está configurado; sin estado, la licencia viaja
 * en la propia URL de éxito.
 */
export async function onRequestGet({ params, env }) {
  if (!hasDB(env)) {
    return json({ error: 'Sin persistencia: la licencia se entrega en la URL de éxito.' }, 404)
  }
  const order = await getOrderWithLicense(env.DB, params.ref)
  if (!order) return json({ error: 'Pedido no encontrado.' }, 404)
  return json(order)
}
