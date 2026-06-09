# PULPO_WEB

Sitio comercial de **PULPO — IDS/IPS Monitor**: landing page de producto + backend de
*checkout*, licencias y captación de leads, desplegable **al completo en Cloudflare Pages**
(frontend estático + **Pages Functions** + **D1** opcional). Estética SOC oscura/cian y
modelo de precios por host realista para el sector (Community → Pro → Enterprise).

> Ecosistema PULPO:
> [Motor IDS/IPS (Python)](https://github.com/1van106/LogClassifier) ·
> [Dashboard (Electron)](https://github.com/1van106/PULPO__IDS-IPS) ·
> **Web comercial (este repo)**

---

## ✨ Qué incluye

**Frontend** (`public/`) — landing estática sin framework: hero con mockup del dashboard,
métricas, características, pipeline, precios con *toggle* mensual/anual, comparativa, FAQ y CTA.
100% responsive.

**Backend** (`functions/`) — API sobre **Cloudflare Pages Functions** (runtime Workers),
**cero dependencias de runtime**:
- **Checkout en modo demo**: el flujo de compra funciona y se ve real, pero no cobra.
- **Licencias firmadas** (HMAC-SHA256 con Web Crypto), verificables *offline* por el agente.
- **Captación de leads** del plan Enterprise.
- **Descargas** que apuntan a las releases del IDS.
- Persistencia **opcional** en **Cloudflare D1**: si no la configuras, todo funciona igual
  sin estado (las licencias se entregan firmadas en la propia URL de éxito).

---

## 🚀 Desplegar en Cloudflare Pages (lo mínimo)

1. **Conecta el repo** en el panel de Cloudflare → *Workers & Pages* → *Create* → *Pages* →
   *Connect to Git* → elige `PULPO_WEB`.
2. Configuración de build:
   - **Build command**: *(vacío)*
   - **Build output directory**: `public`
   - Cloudflare detecta `functions/` automáticamente.
3. En *Settings → Variables and Secrets*, añade el secreto **`LICENSE_SECRET`**
   (una cadena larga y aleatoria).
4. *Deploy*. Listo: la web y su API funcionan ya en modo demo, sin base de datos.

Apunta tu dominio en *Custom domains* y a correr.

---

## 🗄️ Activar persistencia con D1 (opcional)

Para guardar pedidos, licencias, leads y descargas:

```bash
npm install
npm run db:create          # crea la base 'pulpo' y muestra el database_id
# pega ese database_id en wrangler.toml y descomenta el bloque [[d1_databases]]
npm run db:schema          # crea las tablas en remoto
```

Luego, en el panel de Pages, vincula el binding **D1** llamado `DB` a la base `pulpo`
(*Settings → Functions → D1 database bindings*) y vuelve a desplegar.

---

## 💻 Desarrollo local

```bash
npm install
cp .dev.vars.example .dev.vars   # ajusta LICENSE_SECRET
npm run dev                      # http://localhost:8788  (sin estado)
# con D1 local:
npm run db:schema:local
npm run dev:d1
```

---

## 🔌 API

| Método | Ruta | Descripción |
|---|---|---|
| `GET`  | `/api/health` | Estado y tipo de persistencia (d1 / stateless). |
| `POST` | `/api/checkout` | Crea el pedido (demo) y devuelve la URL de éxito. Body: `{ plan, billing, hosts }`. |
| `GET`  | `/api/order/:ref` | Estado del pedido y licencia (solo con D1). |
| `POST` | `/api/leads` | Lead Enterprise. Body: `{ name, email, company, hosts, message }`. |
| `POST` | `/api/download/:plan` | Registra la descarga y devuelve la URL del artefacto. |
| `POST` | `/api/licenses/verify` | Verifica una clave de licencia. Body: `{ token }`. |

### Flujo de compra (Pro, demo)

1. El cliente pulsa **Empezar prueba** → `POST /api/checkout`.
2. Se emite una **licencia firmada** y se redirige a `/success.html`.
3. La página de éxito muestra la clave y permite copiarla.
4. El agente PULPO la valida con `POST /api/licenses/verify` (firma + expiración).

---

## 📁 Estructura

```
PULPO_WEB/
├── public/                  # Frontend estático
│   ├── index.html
│   ├── success.html         # Página post-compra con la licencia
│   ├── pulpo.css
│   ├── pulpo-app.js         # Interacciones de la landing (diseño)
│   └── pulpo-store.js       # Conexión con la API (checkout, leads, descargas)
├── functions/               # Cloudflare Pages Functions (API)
│   ├── _lib/                # util, config, license (HMAC), store (D1)
│   └── api/                 # health, checkout, leads, order/[ref], download/[plan], licenses/verify
├── schema.sql               # Esquema de D1
├── wrangler.toml            # Config de Pages + binding D1 (comentado)
└── .dev.vars.example        # Secretos de desarrollo local
```

---

## 🔒 Notas

- `LICENSE_SECRET` firma las licencias: usa uno largo y aleatorio, y nunca lo subas al repo.
- Modo **demo**: no se procesan pagos reales. Para cobrar de verdad habría que integrar
  Stripe sobre Workers + D1 (no incluido en esta versión).

## 📝 Licencia

MIT © Iván Batista
