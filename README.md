# PortalHoteles.com

Plataforma tipo directorio/marketplace de hoteles. Ver [SPEC.md](./SPEC.md) para la especificación completa del proyecto.

## Estado actual: Fase 1

Esta fase entrega solo la base: estructura de carpetas, backend con Express y la base de datos SQLite con su esquema. Todavía no hay frontend ni endpoints de API para hoteles/habitaciones/etc. — eso se construye en las fases siguientes.

## Estructura

```
.
├── backend/          # API Node.js + Express + SQLite
│   ├── src/
│   │   ├── config/    # conexión a la base de datos
│   │   ├── db/        # esquema SQL y script de inicialización
│   │   ├── routes/     )  vacíos por ahora,
│   │   ├── controllers/ ) se llenan en próximas fases
│   │   ├── middleware/  )
│   │   └── server.js  # punto de entrada de Express
│   ├── uploads/       # imágenes subidas (logos, fotos de habitaciones)
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
npm run db:init   # crea/actualiza el archivo SQLite ejecutando src/db/schema.sql
npm run dev        # arranca el servidor con recarga automática (node --watch)
npm start          # arranca el servidor
```

El servidor expone `GET /api/health` como chequeo de estado. Por defecto corre en `http://localhost:3001` (configurable con `PORT` en `.env`).

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

- Endpoints REST (auth, CRUD de hoteles/habitaciones, panel admin)
- Frontend en React
- Lógica de activación (regla de mínimo 4 habitaciones) y roles/permisos
