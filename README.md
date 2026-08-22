# Gestor de Leads — Pre-Diagnóstico IMSS

Sistema integral para el **Despacho Fiscal 2087 (Contador Gerardo Huerta)**: landing pública de captación de prospectos de pensión IMSS + CRM interno para clasificación, seguimiento y contacto.

## Qué hace

- **Landing pública** (`/`) — formulario de 2 pasos con consentimiento LFPDPPP; capta nombre, teléfono, correo, situación y tema de interés
- **CRM interno** (`/dashboard`, `/leads`, `/leads/[id]`, `/settings`) — un solo administrador gestiona, clasifica y da seguimiento a los leads
- **Clasificación automática** — al llegar un lead se asigna categoría, prioridad, viabilidad (score 0–100) y segmento de interés A/B/C
- **Detección de duplicados** — mismo teléfono o correo incrementa `vecesRecibido` sin crear registro nuevo
- **Notificaciones push** — browser push al llegar un lead nuevo; campana en el CRM con leads sin contactar y seguimientos vencidos
- **Aviso de privacidad** (`/aviso-de-privacidad`) — página LFPDPPP con responsable, datos recabados, derechos ARCO e información del INAI

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16.2.9 (App Router) |
| UI | React 19 + Tailwind CSS v4 + shadcn/ui (Radix UI) |
| Base de datos | SQLite (desarrollo) / PostgreSQL (producción) vía Prisma 5 |
| Auth | Auth.js v5 — Credentials + JWT 8h |
| Proxy/Middleware | `src/proxy.ts` — protege rutas del CRM |
| Email | Resend |
| Push | Web Push API + `web-push` npm |
| Fuentes (landing) | Google Fonts vía `next/font` — Roboto + Open Sans |

## Estructura de rutas

```
/                          → Landing pública (formulario de pre-diagnóstico)
/gracias                   → Confirmación post-envío (no indexada)
/aviso-de-privacidad       → Aviso de privacidad LFPDPPP
/login                     → Login del administrador
/dashboard                 → KPIs, cola de prioridad, seguimientos vencidos
/leads                     → Tabla filtrable (Activos / Archivados)
/leads/[id]                → Detalle: clasificación, acciones, notas, historial
/settings                  → Info del sistema (URL landing, rate limit, versión)
/admin                     → Redirige a /dashboard
/pipeline                  → Redirige a /leads

/api/public/leads          → POST — recibe formularios (rate limit 5/min por IP)
/api/leads/[id]            → DELETE — elimina lead con cascada
/api/leads/[id]/update     → PATCH — actualiza un campo a la vez (allowlist)
/api/leads/[id]/action     → POST — whatsapp_enviado / correo_enviado / archivado
/api/leads/[id]/notes      → POST — agrega nota interna
/api/leads/export          → GET — descarga leads filtrados como .xlsx
/api/leads/import          → POST — importa .xlsx/.xls/.csv (hasta 1,000 filas)
/api/notifications         → GET — badge y listas para la campana
/api/push/subscribe        → POST/DELETE — suscripciones Web Push
```

---

## Instalación local (desarrollo)

### Requisitos

- Node.js 20+
- npm

### Pasos

```bash
# 1. Clonar repositorio
git clone https://github.com/davidhielo91/pre-contador
cd pre-contador

# 2. Instalar dependencias
npm install

# 3. Crear .env (Prisma lo lee; Next.js lee .env y .env.local)
```

Contenido mínimo de `.env`:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="cualquier-string"
AUTH_URL="http://localhost:3000"
ADMIN_EMAIL="admin@despacho.com"
ADMIN_PASSWORD="admin123"
```

```bash
# 4. Activar schema SQLite y crear la base de datos
npm run db:use:sqlite
npm run db:push

# 5. Crear usuario admin
npm run db:seed

# 6. Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Login con las credenciales de `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

> **`DATABASE_URL` local:** usa `file:./dev.db` (no `file:./prisma/dev.db`). Prisma CLI resuelve rutas relativas desde el directorio del schema (`prisma/`), por lo que `./dev.db` produce `prisma/dev.db`, que es la misma ruta que resuelve Next.js desde la raíz del proyecto.

> **⚠ Nunca commitees `schema.prisma` con `provider = "sqlite"`.** Después de usar `npm run db:use:sqlite` para desarrollo, corre `npm run db:use:postgres` antes de cualquier `git add`. El repo siempre debe tener el schema en PostgreSQL; de lo contrario el contenedor de producción falla al arrancar.

### Variables de entorno

| Variable | Dev local | Producción |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | PostgreSQL connection string |
| `AUTH_SECRET` | cualquier string | requerido (`openssl rand -base64 32`) |
| `AUTH_URL` | `http://localhost:3000` | URL pública de la app |
| `AUTH_TRUST_HOST` | — | `true` (detrás de reverse proxy) |
| `ADMIN_EMAIL` | `admin@despacho.com` | requerido |
| `ADMIN_PASSWORD` | `admin123` | requerido |
| `NEXT_PUBLIC_BASE_URL` | — | URL pública de la app |
| `RESEND_API_KEY` | — | Transactional email vía Resend |
| `RESEND_FROM_EMAIL` | — | Dirección verificada en Resend |
| `NOTIFICATION_EMAIL` | — | Recibe alertas de nuevos leads (default: `ADMIN_EMAIL`) |
| `VAPID_PUBLIC_KEY` | — | Web Push (generar con `npx web-push generate-vapid-keys`) |
| `VAPID_PRIVATE_KEY` | — | Web Push |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | — | Mismo valor que `VAPID_PUBLIC_KEY` (expuesto al browser) |

### Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm run db:use:sqlite` | Activa schema SQLite para desarrollo local |
| `npm run db:use:postgres` | Restaura schema PostgreSQL para producción |
| `npm run db:push` | Aplica el schema a la BD **local** sin historial (solo dev) |
| `npm run db:migrate` | Crea migración con historial — requerido para campos nuevos en producción |
| `npm run db:seed` | Crea/sincroniza admin y reasigna leads sin usuario |
| `npm run db:studio` | Abre Prisma Studio (GUI de la BD) |

---

## Despliegue en producción — EasyPanel

### Via GitHub

1. Conectar el repositorio en EasyPanel → **New Service → App → GitHub**
2. EasyPanel detecta el `Dockerfile` automáticamente
3. Configurar variables de entorno (todas las de la tabla anterior)
4. Deploy

### Via ZIP

```bash
git archive HEAD --format=zip -o deploy.zip
```

EasyPanel → **New Service → App → Upload ZIP**

### Variables mínimas en EasyPanel

```env
DATABASE_URL=postgresql://usuario:contraseña@servicio-db:5432/nombre-db
AUTH_SECRET=<openssl rand -base64 32>
AUTH_URL=https://tu-dominio.easypanel.host
AUTH_TRUST_HOST=true
ADMIN_EMAIL=tu-email@dominio.com
ADMIN_PASSWORD=tu-contraseña-segura
NEXT_PUBLIC_BASE_URL=https://tu-dominio.easypanel.host
```

> **Contraseñas con caracteres especiales en `DATABASE_URL`:** URL-encodea el password (`$` → `%24`, `@` → `%40`, `&` → `%26`).

### Qué hace el contenedor al arrancar

```
1. prisma migrate deploy   → aplica migraciones pendientes a PostgreSQL
2. node prisma/seed.js     → upsert admin + reasigna leads sin usuario
3. node server.js          → inicia Next.js standalone
```

El seed **siempre sincroniza** la contraseña del admin con `ADMIN_PASSWORD`, por lo que redesplegar con una nueva contraseña la actualiza automáticamente.

> **Campos nuevos en el schema:** si agregas una columna en dev con `db:push`, debes crear también el archivo de migración SQL en `prisma/migrations/` para que `migrate deploy` lo aplique en producción. Copia el formato de migraciones existentes (`ALTER TABLE "Lead" ADD COLUMN ...`) y dale un nombre con timestamp ascendente.

---

## Modelos de datos

```
User ──< Lead ──< LeadActivity
               ──< LeadStatusHistory
               ──< LeadNote
PushSubscription  (standalone, sin FK a User)
```

**Campos clave del Lead:**

| Campo | Descripción |
|---|---|
| `estadoLead` | `Nuevo` → `Contactado` → `Archivado` |
| `categoria` | Clasificación automática (Ley 73, Modalidad 40, Viudez, etc.) |
| `prioridad` | `Alta` / `Media` / `Baja` |
| `scoreViabilidad` | 0–100; ≥70 = Candidato fuerte, ≥40 = Revisar, <40 = Baja viabilidad |
| `segmentoInteres` | `A` (listo), `B` (interesado con dudas), `C` (curioso) — auto + manual |
| `telefonoNormalizado` | 10 dígitos sin prefijo 52 — usado para deduplicar y links WA |
| `vecesRecibido` | Cuántas veces envió el formulario (no incrementa en importación) |
| `fechaProximaAccion` | Recordatorio de seguimiento — visible en dashboard y campana |

---

## Clasificación automática

En `src/lib/classification.ts`, al crear un lead:

| Campo | Lógica |
|---|---|
| `categoria` | Palabras clave en `situacion` + `temaInteres` |
| `prioridad` | Alta si edad > 60, invalidez o urgencia en texto |
| `scoreViabilidad` | Reglas sobre categoría, semanas, pensión mínima garantizada ($10,634 MXN) |
| `segmentoInteres` | A = objetivo específico + semanas o situación detallada; C = objetivo vago o descripción corta; B = resto |

---

## Seguridad

- `src/proxy.ts` — protege todas las rutas del CRM; públicas sin auth: `/`, `/gracias`, `/aviso-de-privacidad`, `/login`, `/api/auth/*`, `/api/public/*`
- `AUTH_TRUST_HOST=true` requerido en producción detrás de reverse proxy
- `ALLOWED_FIELDS` whitelist en PATCH de update — solo campos autorizados
- `web-push` y `src/lib/push.ts` solo se importan en server-side (API routes) — nunca en componentes cliente
- Landing CSS aislada con `.landing-root` — no interfiere con Tailwind del CRM
- Consentimiento LFPDPPP obligatorio en el formulario público antes de enviar

---

## Créditos

Despacho Fiscal 2087 — Contador Gerardo Huerta  
Pensiones IMSS y Jubilación — Ciudad Juárez, Chihuahua
