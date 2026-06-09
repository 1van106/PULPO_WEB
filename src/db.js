import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', 'data')
mkdirSync(dataDir, { recursive: true })

export const db = new DatabaseSync(join(dataDir, 'pulpo.db'))
db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id                  TEXT PRIMARY KEY,
    plan                TEXT NOT NULL,
    billing             TEXT NOT NULL,
    hosts               INTEGER NOT NULL DEFAULT 1,
    email               TEXT,
    status              TEXT NOT NULL DEFAULT 'pending',  -- pending | paid | canceled
    stripe_session_id   TEXT,
    stripe_customer_id  TEXT,
    license_id          TEXT,
    created_at          TEXT NOT NULL,
    paid_at             TEXT
  );

  CREATE TABLE IF NOT EXISTS licenses (
    id          TEXT PRIMARY KEY,
    token       TEXT NOT NULL,
    plan        TEXT NOT NULL,
    hosts       INTEGER NOT NULL DEFAULT 1,
    email       TEXT,
    order_id    TEXT,
    status      TEXT NOT NULL DEFAULT 'active',           -- active | revoked
    issued_at   TEXT NOT NULL,
    expires_at  TEXT
  );

  CREATE TABLE IF NOT EXISTS leads (
    id          TEXT PRIMARY KEY,
    ref         TEXT NOT NULL,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    company     TEXT,
    hosts       INTEGER,
    message     TEXT,
    created_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS downloads (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    plan        TEXT NOT NULL,
    artifact    TEXT NOT NULL,
    ip          TEXT,
    user_agent  TEXT,
    created_at  TEXT NOT NULL
  );
`)

export const queries = {
  insertOrder: db.prepare(`
    INSERT INTO orders (id, plan, billing, hosts, email, status, stripe_session_id, created_at)
    VALUES (@id, @plan, @billing, @hosts, @email, @status, @stripe_session_id, @created_at)
  `),
  getOrder: db.prepare(`SELECT * FROM orders WHERE id = ?`),
  getOrderBySession: db.prepare(`SELECT * FROM orders WHERE stripe_session_id = ?`),
  markOrderPaid: db.prepare(`
    UPDATE orders SET status = 'paid', paid_at = @paid_at, license_id = @license_id,
                      stripe_customer_id = @stripe_customer_id, email = COALESCE(@email, email)
    WHERE id = @id
  `),

  insertLicense: db.prepare(`
    INSERT INTO licenses (id, token, plan, hosts, email, order_id, status, issued_at, expires_at)
    VALUES (@id, @token, @plan, @hosts, @email, @order_id, 'active', @issued_at, @expires_at)
  `),
  getLicense: db.prepare(`SELECT * FROM licenses WHERE id = ?`),

  insertLead: db.prepare(`
    INSERT INTO leads (id, ref, name, email, company, hosts, message, created_at)
    VALUES (@id, @ref, @name, @email, @company, @hosts, @message, @created_at)
  `),

  insertDownload: db.prepare(`
    INSERT INTO downloads (plan, artifact, ip, user_agent, created_at)
    VALUES (@plan, @artifact, @ip, @user_agent, @created_at)
  `)
}
