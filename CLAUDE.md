# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Phase 1 (folder structure, Express skeleton, SQLite schema), Phase 2 (core REST endpoints), Phase 3 (Destinos endpoints + simulated cache refresh), Phase 4 (WhatsApp reservation link + general contact form), Phase 5 (frontend scaffold + public Home, plus the banner destacado backend it needed), Phase 6 (frontend Registro/Login/password recovery, wired to the real backend, with a persisted session), Phase 7 (the real `/panel-hotel`: edit profile, room CRUD, activation, plus the `PUT /hotel/me` backend endpoint it needed, plus a visibility-rule bug fix found during that phase), and Phase 8 (the public hotel profile `/:slug`: details, room list, WhatsApp reservation form, plus the `GET /public/hoteles/:slug` backend endpoint it needed) are done — see `README.md` for phase status and `API.md` for full endpoint docs. Destinos, Contacto, and the admin panel are still routed placeholders (or, for the admin panel, not even that). **Read `SPEC.md` in full before writing any code**; it is the source of truth for scope, and any change of scope must be reflected there first, per the doc's own instructions.

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

```bash
cd frontend
npm install
cp .env.example .env       # VITE_API_URL defaults to http://localhost:3001/api
npm run dev                 # Vite dev server on http://localhost:5173 (needs the backend running)
npm run build                # production build to frontend/dist
```

No test runner or linter is configured on either side yet. Frontend verification so far: `npm run build` (catches syntax/import errors) + manually checking API response shapes against what the components expect. There's no headless-browser tooling in this environment (no `chromium-cli`) — nobody has visually screenshotted the rendered UI yet. If you touch frontend UI code, actually open `http://localhost:5173` (or get the user to) before calling it done; don't rely on the build passing as proof it renders correctly.

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
- **Only one banner can be `activo` at a time** (spec section 9.1), enforced in the application layer, not a DB constraint: `POST /admin/banners/:id/activar` (`adminBanner.controller.js`) deactivates every other row inside the same `db.transaction`, then activates the target. `POST`/`PUT` on `/admin/banners` never touch `activo` directly — activation is deliberately a separate action, mirroring the hotel activar/desactivar split. `PUT` with an `imagenes` array replaces the whole gallery (delete-all-then-reinsert) rather than diffing individual images.
- **The banner backend was added in Phase 5, not Phase 2-4**, specifically because the frontend Home needed `GET /public/banner` to build the carousel — it wasn't originally planned as backend scope. If you're looking for "when was banner_destacado added," it's tied to the frontend Home work, not the admin-panel phases.
- **`PUT /hotel/me` (added Phase 7, same "frontend needed it" pattern as the banner) never regenerates `slug`** even when `nombre` changes — deliberate, since the slug is baked into the public profile URL, the banner's `link`, and any already-shared WhatsApp reservation link. It also can't touch `email`/`password` (use the reset flow), `whatsapp_numero`/`precio_referencia` (no UI for those yet), or `activo` (use `/hotel/activar`/`/hotel/desactivar`) — keep it scoped to exactly the fields `PanelDatosGenerales.jsx` edits.
- **Visibility rule (spec section 3, "`activo` Y >= 4 habitaciones") is enforced by two independent layers, on purpose** — found desynced during Phase 7 testing (an active hotel that dropped below 4 rooms stayed visible on the public home) and fixed with defense in depth, not a single patch:
  1. `DELETE /hotel/habitaciones/:id` (`habitaciones.controller.js#remove`) re-counts the hotel's rooms *inside the same `db.transaction`* as the delete, and flips `activo` to `0` if the count drops below `MIN_HABITACIONES` and the hotel was active. `UPDATE ... WHERE id = ? AND activo = 1` — a no-op if it was already inactive.
  2. `GET /public/hoteles` (`public.controller.js#listHoteles`) never trusts `activo` alone: the `WHERE` clause always includes a correlated subquery re-counting `habitaciones` live and requiring `>= MIN_HABITACIONES`, so even if `activo` were wrong for some other reason (bug, direct DB edit), the hotel still wouldn't appear. Verified independently by forcing `activo = 1` directly in SQLite for an under-4-rooms hotel and confirming it still doesn't show up.
  Both layers import the same `MIN_HABITACIONES` constant from `hotelEstado.controller.js` (also used by `/hotel/activar`) — never hardcode `4` again anywhere else; there are now three call sites that must agree on this number, all sourced from one place.
- **`GET /public/hoteles/:slug` (added Phase 8, same "frontend needed it" pattern) applies the identical two-layer visibility rule** as `GET /public/hoteles` — not found, inactive, and under-minimum-rooms all collapse into the same `404 Hotel no encontrado`, matching the existing "don't leak which condition failed" convention used elsewhere (room ownership 404s, forgot-password's generic response). Its response deliberately omits `whatsapp_numero` (the reservation endpoint builds the `wa.me` link server-side; the public detail page never needs the raw number) and `precio_referencia`/`activo`/timestamps, and each room in the list omits `precio`/`fotos` — same field-scope decision as the Phase 7 panel room form, kept consistent rather than exposing more here than the panel itself edits.

## Frontend architecture

React + Vite, plain JS (no TypeScript), `react-router-dom` for routing, no state management library (local `useState`/`useEffect` only — the app doesn't need more yet). Layout: `frontend/src/{api,context,components,pages,styles,utils}`.

- **Dark-by-default theming, not system-preference-based**: `context/ThemeContext.jsx` reads `localStorage.theme` and defaults to `'dark'` if unset — it deliberately does **not** consult `prefers-color-scheme`, per spec section 10's explicit "oscuro por defecto." The CSS itself mirrors this: `:root` in `styles/global.css` holds the dark values directly (not gated behind `[data-theme="dark"]`), with `:root[data-theme="light"]` as the override — so there's no flash-of-wrong-theme before JS runs.
- **Exactly 3 hue-bearing colors** in `global.css` custom properties (spec section 10's cap): a gold accent, a charcoal neutral, and a cream neutral. The charcoal/cream pair swaps between bg/text roles depending on `data-theme`; don't add a 4th brand color without checking the spec constraint still applies.
- **Country flags are emoji, computed locally, no network/CDN dependency**: `utils/countryFlags.js` maps a hardcoded set of Spanish country names to ISO alpha-2 codes, then converts to a flag emoji via Unicode regional indicator math. `hotel.pais` is free-text on the backend (no ISO code stored), so unmapped country names fall back to a generic white-flag emoji rather than erroring — extend the lookup table rather than trying to make this fuzzy-match.
- **Fonts are bundled via `@fontsource`, not a Google Fonts `<link>`**: avoids a runtime dependency on an external CDN. If you add font weights, import the specific `@fontsource/<family>/<weight>.css` files in `main.jsx` rather than pulling in the whole family.
- **`FM_WEB_LAB_URL` is an unset env var by design** (`VITE_FM_WEB_LAB_URL`, read in `Footer.jsx`, falls back to `#`): the spec requires crediting "FM WEB LAB" with a link, but no real URL was ever provided. Don't invent/guess one — fill in the env var once the real URL is known.
- **Routes exist for pages that aren't built yet**: `/destinos` and `/contacto` still render `components/ProximamentePage.jsx` placeholders so header navigation doesn't 404. When you implement one of these for real, replace the page component in `pages/`, not the route wiring in `App.jsx`.
- **`pages/Home.jsx` fetches the hotel list twice on purpose**: once unfiltered (to derive the país/ciudad filter dropdown options, with ciudad cascading off the selected país) and once with the active filters (debounced 300ms) to render the grid. Don't collapse these into one fetch — the dropdowns need the *unfiltered* option set even when a filter is currently narrowing the displayed grid.
- **No screenshot-based UI verification has happened yet** (see Commands section) — treat any prior "it works" claim about the frontend as build-verified and API-shape-verified only, not visually verified, until someone actually opens it in a browser.
- **Hotel session lives in `context/AuthContext.jsx`**, mirroring `{ token, hotel }` — the exact shape `POST /auth/hotel/registro` and `POST /auth/hotel/login` return, so `login(data)` can be called directly with the raw API response. Persisted to `localStorage` under `portalhoteles_hotel_auth` so a page refresh doesn't drop the session. There is deliberately no token-expiry check on the frontend (the backend JWT still expires server-side; an expired token just makes the next authenticated fetch fail) — don't add silent auto-logout without checking with the user, it'd change UX behavior not asked for.
- **`components/PrivateRoute.jsx`** gates `/panel-hotel`: redirects to `/login` with the attempted location in router state, and `Login.jsx` reads `location.state?.from?.pathname` to send the user back where they were headed after a successful login. Reuse this pattern (component wrapping the `element`, not a route-level `loader`) for any future protected route rather than introducing a second auth-gating mechanism.
- **The forgot-password page deliberately surfaces the backend's dev-mode reset token in the UI** (`pages/RecuperarPassword.jsx` renders `result.resetToken` and `result.dev_note` when present, with a button straight into `/restablecer-password?token=...`) — this only works because the backend itself puts the raw token in the JSON response (see the Password reset bullet under Backend architecture). It's a matched pair: don't change one side without the other, and rip out the UI exposure once real email delivery exists.
- **Client-side validation mirrors but doesn't replace backend validation**: `utils/validators.js#isValidEmail` uses the same regex as `backend/src/utils/validation.js#isValidEmail`, and password-length/required checks mirror the backend's rules, but every form still surfaces the backend's actual error message (via the thrown `Error` from `api/client.js#request`, which reads `data.error`) in a `.form-banner--error` — e.g. duplicate-email `409`s are only catchable that way, no client-side check could know in advance.
- **`api/client.js` auth-aware functions take `token` as an explicit first argument** (`getMisDatos(token)`, `crearHabitacion(token, datos)`, etc.) rather than reading it from context internally — keeps the API client framework-agnostic (no React import in `api/`). Callers (panel components) pull `token` from `useAuth()` and pass it through. Follow this pattern for any new authenticated endpoint rather than having `api/client.js` reach into `AuthContext` itself.
- **`pages/PanelHotel.jsx` is the single source of truth for panel state**: it fetches `GET /hotel/me` once into `estado` and passes it down to `PanelActivacion`/`PanelDatosGenerales`; the child components call `onCambio` (= `cargarEstado`) after any successful mutation (profile save, room create/edit/delete, activar/desactivar) rather than managing their own copy of the room count or `activo` flag. `PanelHabitaciones` does keep its own local room *list* (for its own list/edit/delete UI) but still re-fetches via the same `onCambio` callback so the parent's count/activation state stays in sync — don't let child components silently drift from `estado`.
- **`components/panel/HabitacionForm.jsx` is shared between create and edit** (`PanelHabitaciones.jsx` renders it inline both for "Agregar habitación" and for the currently-edited row) — extend this one component rather than forking a second form if you add fields.
- **The room form only exposes `descripcion`, `tipo_bano`, `tamano_cama`, `capacidad_huespedes`** — no `precio` or `fotos` fields, even though the backend supports both as optional. This was an explicit scope decision (the user's Phase 7 field list didn't include them), not an oversight; `tipo_bano`/`tamano_cama` are fixed `<select>` options (`Privado`/`Compartido`, `Individual`/`Doble`/`Queen`/`King`) rather than free text, for cleaner/more testable data despite the backend accepting any string.
- **`pages/HotelPerfil.jsx` treats every fetch failure as "not found"**, not just an actual `404`: the `.catch()` on `getHotelPublico(slug)` sets the same `notFound` state regardless of the underlying error (network failure, 500, etc.) and renders `components/hotel-perfil/HotelNoEncontrado.jsx`. This was a deliberate choice per the user's explicit ask ("mostrar una página de 'no encontrado' en vez de un error crudo") — a public visitor doesn't benefit from distinguishing failure modes here. Don't add a distinct error state without checking with the user; it'd change this intentional behavior.
- **`components/hotel-perfil/ReservaForm.jsx` client-side validation is a line-for-line mirror of `backend/src/controllers/reservas.controller.js`**: same order (dates before guest-count-vs-capacity), same messages, same `todayStr()`-style comparison (`utils/dates.js#todayStr`, shared with nothing on the backend but computed identically — `new Date().toISOString().slice(0,10)`). The date `<input type="date">` fields already guarantee valid calendar dates and `YYYY-MM-DD` format natively (unlike the backend's regex-based `isValidDateString`), so the frontend doesn't need to replicate that specific check — only "not in the past" and "salida after entrada."
- **After a successful reservation, the WhatsApp link is both auto-opened and shown as a fallback link**: `window.open(data.whatsapp_url, '_blank', 'noopener,noreferrer')` is best-effort (async continuations after `await` can lose the "user gesture" flag in some browsers and get popup-blocked), so the confirmation panel always also renders a real `<a href={resultado.whatsapp_url}>` button — that's the reliable path, and the one worth testing/clicking in QA automation rather than relying on the popup.

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

The "Activar" button is disabled until the 4-room minimum is met, and should show a message indicating how many rooms are still needed. This 3-vs-4 boundary is an explicit QA test target — don't quietly change the threshold or the disabled-state UX. This compound rule is enforced with defense in depth on the backend (auto-deactivate on room delete + a query-level safety net on the public listing) — see the visibility-rule bullet under Backend architecture.

## Roles and access boundaries

| Role | Access |
|---|---|
| Visitante | Public pages only (home, destinos, contacto), no login |
| Hotel (registered user) | Only their own hotel panel/data — must never be able to view another hotel's panel or the super-admin panel |
| Super Admin | Full access: all hotels (active/inactive), manual add/delete of hotels, banner management |

Enforcing the role/permission boundary strictly matters here — it's called out explicitly as a QA target (section 12 of the spec).

## Key routes / pages (spec section references)

- `/` — Home: featured hotel banner (carousel, admin-managed), alphabetical hotel listing, filters (país/ciudad/rango de precio). **Built** (frontend `pages/Home.jsx` + `components/BannerCarousel.jsx`, `HotelFilters.jsx`, `HotelList.jsx`). Backend: `GET /api/public/hoteles`, `GET /api/public/banner`.
- `/destinos` — Destination content per country/city, cached periodically from external sources. **Never copy source text verbatim** — must be original summary + backlink to source. Backend built: `GET /api/public/destinos` (the "periodic cache" is currently simulated, not a real fetch — see the Destinos bullets above). Frontend: placeholder page only.
- `/contacto` — General platform contact form (not hotel-specific). Backend built: `POST /api/contacto`. Frontend: placeholder page only.
- Registro / Login / password recovery for hotels. **Built**, backend and frontend both (`/api/auth/hotel/*`; frontend `pages/Registro.jsx`, `Login.jsx`, `RecuperarPassword.jsx`, `RestablecerPassword.jsx`, session in `context/AuthContext.jsx`).
- Hotel panel (post-login): datos generales (7.1), habitaciones (7.2, min 4), estado Activar/Desactivar (7.3). **Built**, backend and frontend both (`/api/hotel/*` including `PUT /hotel/me`; frontend `pages/PanelHotel.jsx` + `components/panel/{PanelDatosGenerales,PanelHabitaciones,HabitacionForm,PanelActivacion}.jsx`, auth-gated via `PrivateRoute`).
- `/[nombre-del-hotel]` (e.g. `/hotelfaraon`) — Public hotel profile with room listing and a reservation form that redirects to **WhatsApp** with prefilled message (no real payment gateway — out of scope). **Built**, backend and frontend both (`GET /api/public/hoteles/:slug` + `POST /api/public/hoteles/:slug/reservas`, stateless — see the reservation bullets above; frontend `pages/HotelPerfil.jsx` + `components/hotel-perfil/{ReservaForm,HotelNoEncontrado}.jsx`). Hotel cards on Home already link there.
- `/admin` — Super admin panel, including banner/featured-hotel management (9.1: image gallery, link, title, description; only one featured hotel active at a time). Backend built (`/api/admin/*`, including `/admin/banners/*`). No frontend yet at all (not even a placeholder route).

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
