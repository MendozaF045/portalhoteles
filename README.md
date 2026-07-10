# PortalHoteles.com

Plataforma tipo directorio/marketplace de hoteles. Ver [SPEC.md](./SPEC.md) para la especificación completa del proyecto.

## Estado actual: Fase 7

Fase 1 entregó la base (estructura, Express, esquema SQLite). Fase 2 agregó los endpoints REST principales: auth de hotel (JWT), CRUD de habitaciones, activar/desactivar, listado público con filtros, y auth + gestión de super admin. Fase 3 sumó los endpoints de Destinos y un refresh de cache simulado. Fase 4 agregó el link de reserva a WhatsApp y el formulario de contacto general. Fase 5 arrancó el frontend en React (Vite) con el Home público completo, y sumó al backend el CRUD del banner destacado que el Home necesitaba consumir. Fase 6 conectó Registro, Login, y recuperación/restablecimiento de contraseña del hotel al frontend, con sesión persistida. Fase 7 construye el panel real del hotel (`/panel-hotel`): editar datos generales, CRUD de habitaciones, indicador de progreso hacia el mínimo de 4, y activar/desactivar — y suma al backend el `PUT /api/hotel/me` que ese formulario necesitaba. Ver [API.md](./API.md) para el detalle de cada endpoint. Destinos, Contacto, el perfil público de hotel y el panel de super admin siguen siendo placeholders (o no existen todavía).

## Estructura

```
.
├── backend/           # API Node.js + Express + SQLite
│   ├── src/
│   │   ├── config/       # conexión a la base de datos
│   │   ├── db/           # esquema SQL, init, seed del super admin, refresh de destinos
│   │   ├── routes/       # definición de rutas Express por área
│   │   ├── controllers/  # lógica de cada endpoint
│   │   ├── middleware/   # auth (JWT), asyncHandler, error handler
│   │   ├── services/     # lógica reutilizable entre endpoint y script (ej. refresh de destinos)
│   │   ├── utils/        # jwt, password, slug, validación, HttpError
│   │   └── server.js     # punto de entrada de Express
│   ├── uploads/        # imágenes subidas (logos, fotos de habitaciones) — aún sin endpoint de upload
│   └── data/           # archivo SQLite (generado, no versionado)
└── frontend/           # React + Vite
    └── src/
        ├── api/           # cliente fetch hacia el backend
        ├── context/       # ThemeContext (modo oscuro/claro), AuthContext (sesión de hotel)
        ├── components/    # Header, Footer, Layout, BannerCarousel, HotelCard, HotelFilters, HotelList, FormField, PrivateRoute
        │   └── panel/       # PanelDatosGenerales, PanelHabitaciones, HabitacionForm, PanelActivacion
        ├── pages/         # Home, Registro, Login, RecuperarPassword, RestablecerPassword, PanelHotel (completos)
        │                  # + placeholders (Destinos, Contacto, perfil de hotel)
        ├── styles/        # global.css (variables de color, tipografías, layout, formularios)
        └── utils/         # countryFlags (nombre de país -> emoji de bandera), validators (email)
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
| `contactos` | Mensajes del formulario de contacto general de la plataforma |
| `banner_destacado` / `banner_imagenes` | Banner del home (título, descripción, link, galería); solo uno puede estar `activo` a la vez |

## Frontend

### Requisitos

- Node.js 22+ (el backend debe estar corriendo en `http://localhost:3001` — ver arriba)

### Instalación

```bash
cd frontend
npm install
cp .env.example .env
```

### Comandos

```bash
npm run dev       # arranca Vite en http://localhost:5173 con hot reload
npm run build     # build de produccion en frontend/dist
npm run preview   # sirve el build de produccion localmente
```

### Diseño

Sigue SPEC.md sección 10: modo oscuro por defecto con toggle a claro (persistido en `localStorage`, no depende de la preferencia del sistema), tipografías Montserrat (texto) + League Spartan (títulos) vía `@fontsource`, paleta de 3 colores (dorado de acento + carbón oscuro + crema, intercambiados entre fondo/texto según el tema — ver `src/styles/global.css`), radio de bordes de 12px en botones, grid responsive para las tarjetas de hotel.

Como el nombre del país se guarda como texto libre (no hay código ISO en el backend), la bandera de cada tarjeta se resuelve con una tabla de mapeo nombre→emoji en `src/utils/countryFlags.js`; países no mapeados muestran una bandera blanca genérica en vez de fallar.

### Estado

Home (`/`), Registro (`/registro`), Login (`/login`), recuperación/restablecimiento de contraseña, y el panel del hotel (`/panel-hotel`) están construidos de punta a punta contra el backend real. La sesión (token + datos del hotel) se guarda en `localStorage` vía `AuthContext` y sobrevive a un refresh de página. `/panel-hotel` es una ruta protegida (`PrivateRoute` redirige a `/login` si no hay sesión).

El panel de hotel tiene tres secciones: **Estado de publicación** (barra de progreso X/4 habitaciones, botón Activar deshabilitado con mensaje claro hasta llegar al mínimo, Desactivar siempre disponible), **Datos generales** (editar nombre, país, ciudad, logo, descripción, link a la web propia), y **Habitaciones** (listar/crear/editar/eliminar, con selects de tipo de baño y tamaño de cama para datos consistentes). Cualquier cambio en habitaciones refresca automáticamente el indicador de activación.

`/destinos`, `/contacto` y `/:slug` (perfil de hotel) siguen mostrando "Próximamente".

**Nota sobre recuperación de contraseña**: como el backend todavía no envía emails reales (ver `dev_note` en la respuesta de `forgot-password`), la página `/recuperar-password` muestra el token de desarrollo directamente en pantalla con un botón para continuar — es un atajo intencional para poder probar el flujo completo sin Postman ni servidor de correo; hay que reemplazarlo cuando se conecte un servicio de email real.

**Gap conocido** (ver también API.md): si un hotel activo elimina una habitación y queda por debajo de 4, no se desactiva automáticamente, y el listado público tampoco vuelve a filtrar por cantidad — solo por el flag `activo`. Documentado, no corregido en esta fase (es un cambio de lógica de negocio del backend, fuera del alcance de "Frontend - Panel del Hotel").

## Próximas fases

- Frontend: Destinos, Contacto, perfil público de hotel, panel de super admin (incluyendo la UI para gestionar el banner)
- Decidir y corregir el gap de activación vs. cantidad de habitaciones (ver arriba)
- Subida de archivos (logo, fotos de habitaciones, imágenes de banner)
- Envío real de correo para recuperación de contraseña y para el formulario de contacto
- Conectar el refresh de Destinos a una fuente externa real (hoy es simulado)
