-- Esquema de Cloudflare D1 para PULPO_WEB.
-- Aplícalo con:  npm run db:schema   (remoto)  ·  npm run db:schema:local  (local)
-- Las funciones también crean estas tablas de forma perezosa (CREATE TABLE IF NOT EXISTS),
-- así que este fichero es sobre todo documentación del modelo de datos.

CREATE TABLE IF NOT EXISTS orders (
  id          TEXT PRIMARY KEY,
  plan        TEXT,
  billing     TEXT,
  hosts       INTEGER,
  email       TEXT,
  status      TEXT,              -- pending | paid | canceled
  created_at  TEXT,
  paid_at     TEXT
);

CREATE TABLE IF NOT EXISTS licenses (
  id          TEXT PRIMARY KEY,
  token       TEXT,
  plan        TEXT,
  hosts       INTEGER,
  email       TEXT,
  order_id    TEXT,
  status      TEXT,              -- active | revoked
  issued_at   TEXT,
  expires_at  TEXT
);

CREATE TABLE IF NOT EXISTS leads (
  id          TEXT PRIMARY KEY,
  ref         TEXT,
  name        TEXT,
  email       TEXT,
  company     TEXT,
  hosts       INTEGER,
  message     TEXT,
  created_at  TEXT
);

CREATE TABLE IF NOT EXISTS downloads (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  plan        TEXT,
  ip          TEXT,
  user_agent  TEXT,
  created_at  TEXT
);
