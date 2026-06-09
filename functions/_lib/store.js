// Persistencia opcional en Cloudflare D1.
// Si el binding `DB` no está configurado, las funciones operan sin estado
// (las licencias se entregan igualmente, autocontenidas y firmadas).

export const hasDB = (env) => !!(env && env.DB)

export async function ensureSchema(DB) {
  await DB.batch([
    DB.prepare(`CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY, plan TEXT, billing TEXT, hosts INTEGER, email TEXT,
      status TEXT, created_at TEXT, paid_at TEXT
    )`),
    DB.prepare(`CREATE TABLE IF NOT EXISTS licenses (
      id TEXT PRIMARY KEY, token TEXT, plan TEXT, hosts INTEGER, email TEXT,
      order_id TEXT, status TEXT, issued_at TEXT, expires_at TEXT
    )`),
    DB.prepare(`CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY, ref TEXT, name TEXT, email TEXT, company TEXT,
      hosts INTEGER, message TEXT, created_at TEXT
    )`),
    DB.prepare(`CREATE TABLE IF NOT EXISTS downloads (
      id INTEGER PRIMARY KEY AUTOINCREMENT, plan TEXT, ip TEXT, user_agent TEXT, created_at TEXT
    )`)
  ])
}

export async function saveOrderPaid(DB, { orderId, plan, billing, hosts, license }) {
  const now = new Date().toISOString()
  await DB.batch([
    DB.prepare(`INSERT INTO licenses (id, token, plan, hosts, email, order_id, status, issued_at, expires_at)
                VALUES (?,?,?,?,?,?,?,?,?)`)
      .bind(license.id, license.token, license.plan, license.hosts, license.email, orderId, 'active', license.issuedAt, license.expiresAt),
    DB.prepare(`INSERT INTO orders (id, plan, billing, hosts, email, status, created_at, paid_at)
                VALUES (?,?,?,?,?,?,?,?)`)
      .bind(orderId, plan, billing, hosts, license.email, 'paid', now, now)
  ])
}

export async function getOrderWithLicense(DB, ref) {
  const o = await DB.prepare('SELECT * FROM orders WHERE id = ?').bind(ref).first()
  if (!o) return null
  const lic = await DB.prepare('SELECT token, expires_at, email FROM licenses WHERE order_id = ?').bind(ref).first()
  return {
    id: o.id,
    plan: o.plan,
    billing: o.billing,
    hosts: o.hosts,
    status: o.status,
    license: lic ? lic.token : null,
    expires_at: lic ? lic.expires_at : null,
    email: lic ? lic.email : o.email
  }
}

export async function saveLead(DB, lead) {
  await DB.prepare(`INSERT INTO leads (id, ref, name, email, company, hosts, message, created_at)
                    VALUES (?,?,?,?,?,?,?,?)`)
    .bind(lead.id, lead.ref, lead.name, lead.email, lead.company, lead.hosts, lead.message, lead.created_at)
    .run()
}

export async function logDownload(DB, { plan, ip, userAgent }) {
  await DB.prepare(`INSERT INTO downloads (plan, ip, user_agent, created_at) VALUES (?,?,?,?)`)
    .bind(plan, ip || null, userAgent || null, new Date().toISOString())
    .run()
}
