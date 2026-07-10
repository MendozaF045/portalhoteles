# PortalHoteles.com

Plataforma tipo directorio/marketplace de hoteles. Ver [SPEC.md](./SPEC.md) para la especificación completa del proyecto.

## Estado actual: Fase 3

Fase 1 entregó la base (estructura, Express, esquema SQLite). Fase 2 agregó los endpoints REST principales: auth de hotel (JWT), CRUD de habitaciones, activar/desactivar, listado público con filtros, y auth + gestión de super admin. Fase 3 agrega los endpoints de Destinos (contenido por país/ciudad, resumen propio + backlink) y un refresh de cache simulado (todavía sin fuente externa real conectada). Ver [API.md](./API.md) para el detalle de cada endpoint (pensado para probarse con Postman). Todavía no hay frontend.

## Estructura

```
.
├── backend/          # API Node.js + Express + SQLite
│   ├── src/
│   │   ├── config/       # conexión a la base de datos
│   │   ├── db/           # esquema SQL, init, seed del super admin, refresh de destinos
│   │   ├── routes/       # definición de rutas Express por área
│   │   ├── controllers/  # lógica de cada endpoint
│   │   ├── middleware/   # auth (JWT), asyncHandler, error handler
│   │   ├── services/     # lógica reutilizable entre endpoint y script (ej. refresh de destinos)
│   │   ├── utils/        # jwt, password, slug, validación, HttpError
│   │   └── server.js     # punto de entrada de Express
│   ├── uploads/       # imágenes subidas (logos, fotos de habitaciones) — aún sin endpoint de upload
│   └── data/          # archivo SQLite (generado, no versionado)
└── frontend/          # (vacío — se construye en una fase posterior)
```

## Backend

### Requisitos

- Node.js 22+

### Instalación

```bash
cd backend
npm install
cp .env.example .env
```

### Comandos

```bash
npm run db:init          # crea/actualiza el archivo SQLite ejecutando src/db/schema.sql
npm run seed:admin       # crea/actualiza la cuenta de super admin (usa SUPER_ADMIN_EMAIL/PASSWORD de .env)
npm run destinos:refresh # refresca (simulado) el contenido de Destinos por país/ciudad con hoteles registrados
npm run dev              # arranca el servidor con recarga automática (node --watch)
npm start                # arranca el servidor
```

El servidor expone `GET /api/health` como chequeo de estado. Por defecto corre en `http://localhost:3001` (configurable con `PORT` en `.env`). Ver [API.md](./API.md) para todos los demás endpoints.

### Base de datos

SQLite, archivo en `backend/data/portalhoteles.db` (ruta configurable con `DB_PATH` en `.env`). El esquema vive en `backend/src/db/schema.sql` y es idempotente (`CREATE TABLE IF NOT EXISTS`), así que `npm run db:init` es seguro de correr varias veces.

Tablas:

| Tabla | Propósito |
|---|---|
| `usuarios` | Credenciales de login de cada hotel (1:1 con `hoteles`) |
| `super_admin` | Credenciales del super administrador de la plataforma |
| `hoteles` | Datos generales de cada hotel (perfil, ubicación, estado activo/inactivo) |
| `habitaciones` | Habitaciones de cada hotel (FK a `hoteles`, un hotel necesita mínimo 4 para poder activarse) |
| `destinos` | Contenido de la pestaña Destinos por país/ciudad (resumen propio + backlink a la fuente) |

## Próximas fases

- Frontend en React
- Subida de archivos (logo, fotos de habitaciones)
- Envío real de correo para recuperación de contraseña
- Conectar el refresh de Destinos a una fuente externa real (hoy es simulado)
- Endpoints de `/contacto`, banner destacado, perfil público por hotel
