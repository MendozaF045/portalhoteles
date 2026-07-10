# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repository currently contains only `SPEC.md` — no code has been written yet. There is no build, lint, or test tooling to run. **Read `SPEC.md` in full before writing any code**; it is the source of truth for scope, and any change of scope must be reflected there first, per the doc's own instructions.

Once code exists, this file should be updated with real build/lint/test commands and actual architecture (module boundaries, data flow) discovered by reading the code — not duplicated from the spec below.

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
- `/destinos` — Destination content per country/city, cached periodically from external sources. **Never copy source text verbatim** — must be original summary + backlink to source.
- `/contacto` — General platform contact form (not hotel-specific)
- Registro / Login / password recovery for hotels
- Hotel panel (post-login): datos generales (7.1), habitaciones (7.2, min 4), estado Activar/Desactivar (7.3)
- `/[nombre-del-hotel]` (e.g. `/hotelfaraon`) — Public hotel profile with room listing and a reservation form that redirects to **WhatsApp** with prefilled message (no real payment gateway — out of scope)
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
