# PULPO_WEB

Sitio comercial de **PULPO — IDS/IPS Monitor**: landing page de producto + backend de
*checkout*, licencias y captación de leads. Diseñado con la estética SOC oscura/cian de
PULPO y un modelo de precios por host realista para el sector (Community → Pro → Enterprise).

> Parte del ecosistema PULPO:
> [Motor IDS/IPS (Python)](https://github.com/1van106/LogClassifier) ·
> [Dashboard (Electron)](https://github.com/1van106/PULPO__IDS-IPS) ·
> **Web comercial (este repo)**

---

## ✨ Qué incluye

**Frontend** (`public/`) — landing estática, sin framework:
- Hero con mockup del dashboard, métricas, características, pipeline de 5 etapas.
- Tabla de precios con *toggle* mensual/anual y comparativa detallada.
- Sección de confianza, FAQ acordeón y CTA final. 100% responsive.

**Backend** (`src/`) — API REST en Node.js + Express:
- **Checkout con Stripe** (modo suscripción, prueba de 14 días, precio por host).
- **Modo demo automático**: sin claves de Stripe, el pago se simula y se emiten
  licencias reales — listo para enseñar en un portfolio sin cobrar nada.
- **Licencias firmadas** (HMAC-SHA256), verificables *offline* por el agente PULPO.
- **Captación de leads** del plan Enterprise.
- **Descargas** registradas por plan.
- Persistencia en **SQLite** mediante el módulo nativo `node:sqlite` (cero dependencias
  nativas, sin compilación).

---

## 🚀 Arranque rápido

```bash
git clone https://github.com/1van106/PULPO_WEB.git
cd PULPO_WEB
npm install
cp .env.example .env        # ajusta LICENSE_SECRET (y Stripe si quieres pagos reales)
npm start
```

Abre <http://localhost:3000>. Sin `STRIPE_SECRET_KEY`, arranca en **modo demo**.

Requisitos: **Node.js ≥ 22.5** (por `node:sqlite`).

---

## 🔌 API

| Método | Ruta | Descripción |
|---|---|---|
| `GET`  | `/api/health` | Estado y modo (demo/Stripe). |
| `POST` | `/api/checkout` | Crea pedido y devuelve URL de pago. Body: `{ plan, billing, hosts }`. |
| `GET`  | `/api/order/:ref` | Estado del pedido y, si está pagado, la licencia. |
| `POST` | `/api/webhook` | Webhook de Stripe (`checkout.session.completed`). |
| `POST` | `/api/leads` | Lead Enterprise. Body: `{ name, email, company, hosts, message }`. |
| `POST` | `/api/download/:plan` | Registra la descarga y devuelve la URL del binario. |
| `GET`  | `/api/download/file/:plan` | Sirve el artefacto (o un instalador de muestra). |
| `POST` | `/api/licenses/verify` | Verifica una clave de licencia. Body: `{ token }`. |

### Flujo de compra (Pro)

1. El cliente pulsa **Empezar prueba** → `POST /api/checkout`.
2. Redirección a Stripe Checkout (o a la página de éxito simulada en modo demo).
3. Al pagar, Stripe llama a `/api/webhook` → se marca el pedido como pagado y se
   **emite la licencia**. La página de éxito la muestra y permite copiarla.
4. El agente PULPO valida la clave con `POST /api/licenses/verify`.

---

## 💳 Activar Stripe (modo test)

1. Crea una cuenta en [stripe.com](https://stripe.com) y copia tu *Secret key* de test
   (`sk_test_…`) en `.env` → `STRIPE_SECRET_KEY`.
2. Escucha los webhooks en local y copia el *signing secret* (`whsec_…`):
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   ```
   ponlo en `.env` → `STRIPE_WEBHOOK_SECRET`.
3. Reinicia el servidor. Tarjeta de prueba: `4242 4242 4242 4242`, cualquier fecha futura y CVC.

Los precios (por host, en céntimos) se configuran en `.env`:
`PRICE_PRO_MONTHLY`, `PRICE_PRO_ANNUAL`.

---

## 📁 Estructura

```
PULPO_WEB/
├── public/              # Landing estática (HTML/CSS/JS)
│   ├── index.html
│   ├── success.html     # Página post-pago con la licencia
│   ├── pulpo.css
│   ├── pulpo-app.js     # Interacciones de la landing (diseño)
│   └── pulpo-store.js   # Conexión con el backend (checkout, leads, descargas)
├── src/
│   ├── server.js        # App Express
│   ├── config.js        # Planes, precios, env
│   ├── db.js            # SQLite (node:sqlite) + queries
│   ├── license.js       # Emisión y verificación de licencias (HMAC)
│   ├── fulfill.js       # Marca pedido pagado + emite licencia (idempotente)
│   ├── stripe.js        # Cliente Stripe / detección de modo demo
│   └── routes/          # checkout, webhook, leads, downloads, licenses
├── downloads/           # Artefactos (ignorados por git)
├── data/                # Base de datos SQLite (ignorada por git)
└── .env.example
```

---

## 🔒 Notas de seguridad

- El `LICENSE_SECRET` firma las licencias: usa uno largo y aleatorio en producción.
- Nunca subas `.env` ni `data/*.db` (ya están en `.gitignore`).
- El webhook verifica la firma de Stripe antes de fulfillar ningún pedido.

## 📝 Licencia

MIT © Iván Batista
