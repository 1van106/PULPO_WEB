import { json } from '../_lib/util.js'
import { PLANS } from '../_lib/config.js'

export function onRequestGet({ env }) {
  return json({
    ok: true,
    demo: true,
    persistence: env && env.DB ? 'd1' : 'stateless',
    plans: Object.keys(PLANS)
  })
}
