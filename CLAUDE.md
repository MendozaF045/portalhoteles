# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Phase 1 (folder structure, Express skeleton, SQLite schema), Phase 2 (core REST endpoints), Phase 3 (Destinos endpoints + simulated cache refresh), and Phase 4 (WhatsApp reservation link + general contact form) are done — see `README.md` for phase status and `API.md` for full endpoint docs. No frontend yet. **Read `SPEC.md` in full before writing any code**; it is the source of truth for scope, and any change of scope must be reflected there first, per the doc's own instructions.

There is no test suite or linter configured yet — verification so far has been manual (curl/Postman flows against a running server). If you add a test runner or linter, record the actual commands here.

## Commands

```bash
cd backend
npm install
cp .env.example .env       # set JWT_SECRET / SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD
npm run db:init             # (re)creates the SQLite schema, idempotent
npm run seed:admin          # creates/updates the super_admin row from .env
npm run destinos:refresh    # simulated Destinos cache refresh (see below)
npm run dev                 # node --watch src/server.js
npm start
```

## Backend architecture

Layout: `backend/src/{config,db,routes,controllers,middleware,utils}`. Routes are thin — they wire `requireAuth`/`requireRole` + `asyncHandler` around controller functions; business logic and SQL live in the controllers.

- **Auth**: single JWT secret (`JWT_SECRET`, falls back to an insecure dev default with a console warning if unset), two non-interchangeable token roles baked into the payload — `{ role: 'hotel', hotelId, usuarioId }` and `{ role: 'super_admin', adminId }`. `middleware/auth.middleware.js` exports `requireAuth` (verifies the token) and `requireRole(role)` (checks the payload's role); a hotel token against an admin route (or vice versa) is a `403`, not a `401`.
- **Route prefixes**: `/api/auth/hotel`, `/api/auth/admin` (public — login/registro/reset), `/api/hotel/*` (role `hotel`), `/api/admin/*` (role `super_admin`), `/api/public/*` (no auth).
- **Ownership checks**: habitaciones are scoped to `req.auth.hotelId`; updating/deleting a room belonging to another hotel returns `404` (not `403`) to avoid leaking existence — see `getOwnedOrThrow` in `habitaciones.controller.js`.
- **Activation rule** lives in `hotelEstado.controller.js` (`MIN_HABITACIONES = 4`), computed live via `COUNT(*) FROM habitaciones` rather than a stored counter — there is deliberately no `cantidad_habitaciones` column on `hoteles`. Don't add one; it would risk drifting out of sync.
- **better-sqlite3 is synchronous** — writes that need both a password hash and a DB insert (registro, admin's manual-add-with-login) hash the password *before* opening a `db.transaction(...)` callback, since the callback itself must be sync. Follow this pattern for any new multi-step write.
- **Error handling**: throw `HttpError(status, message)` from `utils/httpError.js` inside any handler wrapped in `asyncHandler`; the central `errorHandler` middleware in `middleware/errorHandler.js` turns it into `{ error: message }` with that status.
- **Password reset** (`authHotel.controller.js`): `forgot-password` always returns a generic 200 regardless of whether the email exists (no user enumeration), but — since there's no email service yet — includes the raw reset token in the JSON response when the account does exist, clearly marked `dev_note`. Replace this with real email delivery before anything resembling production use.
- **Super admin has no public registration endpoint** by design (spec: "acceso único y exclusivo"). The account is created/rotated via `npm run seed:admin` (`src/db/seedAdmin.js`), reading `SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD` from `.env`.
- **Admin-added hotels still start `activo: 0`**: the super admin's `POST /admin/hoteles` cannot bypass the activation rule — only the hotel's own `/hotel/activar` can flip that flag. Don't add an admin override; it's an explicit roles/permissions QA boundary (spec section 12).
- **Destinos content has two origins**: `auto` (written by the simulated cache refresh) and `manual` (created or edited via the admin CRUD). `PUT /admin/destinos/:id` always sets `origen = 'manual'` on save, and the refresh's `INSERT ... ON CONFLICT DO UPDATE ... WHERE destinos.origen = 'auto'` (`services/destinosRefresh.js`) is what makes manual edits permanent against future refreshes. Don't change that `WHERE` clause without preserving that guarantee — it's the whole point of the two-origin design.
- **The Destinos refresh is simulated, not real** (spec section 4 wants a periodic cache from external sources; there's no internet integration yet). `buildSimulatedEntry()` in `services/destinosRefresh.js` fabricates one placeholder entry per distinct `pais`/`ciudad` pair found in `hoteles` (regardless of `activo`), clearly labeled as simulated (`fuente_nombre: "Fuente simulada..."`, a fake `fuente-simulada.example` URL). It's called from both `POST /admin/destinos/refresh` and the standalone `npm run destinos:refresh` script (`db/refreshDestinos.js`) — keep sharing that one function rather than duplicating the upsert logic. When a real source is connected later, that's the only function that should need to change.
- **Schema changes require a fresh local DB**: `data/portalhoteles.db` is gitignored and `schema.sql` uses `CREATE TABLE IF NOT EXISTS`, so a column added later (e.g. `destinos.origen` in Phase 3) won't retroactively apply to an existing dev database. If a fresh `npm run db:init` errors or behaves oddly after pulling schema changes, delete `backend/data/` and re-run `db:init` (+ `seed:admin`) — there's no real data to lose in this dev-only sandbox.
- **Reservation flow is stateless by design**: `POST /public/hoteles/:slug/reservas` (`reservas.controller.js`) validates and returns a `wa.me` link — it does not write a `reservas` row anywhere, matching spec section 8/13 (no real booking backend, no payment gateway, WhatsApp redirect only). Don't add persistence here without checking with the user first; it'd be a scope change.
- **Reservation validation order matters for QA**: existence checks (hotel by slug, then room ownership) are `404`s; field-shape checks (dates, guest count) are `400`s; the two explicit boundary rules — `fecha_salida` must be strictly after `fecha_entrada` (equal dates fail too) and `huespedes` must not exceed the room's `capacidad_huespedes` (exactly-at-capacity passes) — are deliberate QA boundary targets from spec section 12. Date comparisons are done as `YYYY-MM-DD` strings (validated format sorts correctly lexically), against `new Date().toISOString().slice(0,10)` as "today" (UTC-based).
- **WhatsApp numbers are normalized, not validated as phone numbers**: `utils/phone.js#normalizePhone` just strips everything but digits before building the `wa.me` URL, so a hotel can store `whatsapp_numero` with `+`, spaces, or dashes. If it normalizes to an empty string (missing/garbage), the reservation endpoint returns `400`.
- **Contacto is intentionally persisted**, not fire-and-forget: `POST /contacto` (spec section 5) writes to the `contactos` table and logs a `console.log` standing in for a real email send (same `dev_note` pattern as password reset). `GET /admin/contactos` exists specifically so this is verifiable via Postman without server console access — keep that pairing if you touch either endpoint.

## What this project is

PortalHoteles.com — a hotel directory/marketplace. Hotels register, fill in their profile and rooms, and (once activated) appear in a public listing with filters. Each hotel gets a public profile page. There's a super-admin panel (platform owner) and a per-hotel panel (registered hotel user).

Secondary purpose: this project doubles as a **QA/testing practice case** (functional, negative, boundary, API, roles, UI automation testing). Intentional bugs will be documented separately in `BUGS.md` for QA to find — don't "fix" undocumented odd behavior without checking whether it's one of those seeded bugs.

## Proposed stack (from spec, not yet implemented)

- Backend: Node.js + Express
- Database: SQLite
- Frontend: React
- Auth: JWT or sessions (undecided)
- Images: local `/uploads` folder in dev, cloud storage later

## Core business rule — hotel visibility (critical, drives a lot of logic)

A hotel appears on the public home page **only if both** are true:
1. It has at least **4 rooms** loaded.
2. The hotel itself clicked **"Activar"** in its panel.

The "Activar" button is disabled until the 4-room minimum is met, and should show a message indicating how many rooms are still needed. This 3-vs-4 boundary is an explicit QA test target — don't quietly change the threshold or the disabled-state UX.

## Roles and access boundaries

| Role | Access |
|---|---|
| Visitante | Public pages only (home, destinos, contacto), no login |
| Hotel (registered user) | Only their own hotel panel/data — must never be able to view another hotel's panel or the super-admin panel |
| Super Admin | Full access: all hotels (active/inactive), manual add/delete of hotels, banner management |

Enforcing the role/permission boundary strictly matters here — it's called out explicitly as a QA target (section 12 of the spec).

## Key routes / pages (spec section references)

- `/` — Home: featured hotel banner (carousel, admin-managed), alphabetical hotel listing, filters (país/ciudad/rango de precio)
- `/destinos` — Destination content per country/city, cached periodically from external sources. **Never copy source text verbatim** — must be original summary + backlink to source. Backend: `GET /api/public/destinos` (see API.md); the "periodic cache" is currently simulated, not a real fetch — see the Destinos bullets above.
- `/contacto` — General platform contact form (not hotel-specific). Backend: `POST /api/contacto`.
- Registro / Login / password recovery for hotels
- Hotel panel (post-login): datos generales (7.1), habitaciones (7.2, min 4), estado Activar/Desactivar (7.3)
- `/[nombre-del-hotel]` (e.g. `/hotelfaraon`) — Public hotel profile with room listing and a reservation form that redirects to **WhatsApp** with prefilled message (no real payment gateway — out of scope). Backend: `POST /api/public/hoteles/:slug/reservas` — stateless, see the reservation bullets above.
- `/admin` — Super admin panel, including banner/featured-hotel management (9.1: image gallery, link, title, description; only one featured hotel active at a time)

Note: hotel profile uses a path (`/hotelfaraon`), not a real subdomain — deliberate choice to avoid DNS/hosting config, per spec section 8.

## UI/design constraints (spec section 10)

- Classic/simple style, no neon backgrounds
- Dark mode by default, with light-mode toggle
- Fonts: Montserrat + League Spartan
- Max 3 colors in the palette
- Button border-radius: 10–15px
- Fully responsive (mobile/tablet/desktop)
- Footer must credit "FM WEB LAB" with a link

## QA-driven implementation notes

Because this project is also a testing sandbox, favor implementation choices that keep it testable:
- Consistent, stable HTML IDs/structure for UI automation (Playwright/Selenium/Cypress)
- Document REST API endpoints so they're testable directly (e.g. via Postman) without going through the UI
- Preserve boundary conditions exactly as specified (e.g. 3 vs 4 rooms) rather than rounding them off during implementation

## Out of scope (do not build unless spec is updated first)

- Real payment processing (reservations only redirect to WhatsApp)
- Real per-hotel subdomains
- Multi-language support
- Fully real-time destination data (periodic cache only)
