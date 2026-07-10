-- PortalHoteles.com — Esquema de base de datos (Fase 1)
-- SQLite

PRAGMA foreign_keys = ON;

-- Cuenta de acceso de un hotel (login). Relación 1:1 con "hoteles".
CREATE TABLE IF NOT EXISTS usuarios (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  reset_token     TEXT,
  reset_token_expires_at TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Cuenta del super administrador de la plataforma. Acceso único y exclusivo.
CREATE TABLE IF NOT EXISTS super_admin (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Hoteles registrados en la plataforma.
CREATE TABLE IF NOT EXISTS hoteles (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id      INTEGER UNIQUE REFERENCES usuarios(id) ON DELETE SET NULL,
  slug            TEXT NOT NULL UNIQUE,       -- usado en /[nombre-del-hotel]
  nombre          TEXT NOT NULL,
  logo_url        TEXT,
  pais            TEXT NOT NULL,
  ciudad          TEXT NOT NULL,
  descripcion     TEXT,
  website_url     TEXT,
  whatsapp_numero TEXT,                       -- destino del formulario de reserva
  precio_referencia REAL,                     -- mostrado en la tarjeta del home
  activo          INTEGER NOT NULL DEFAULT 0 CHECK (activo IN (0, 1)),
  creado_por_admin INTEGER NOT NULL DEFAULT 0 CHECK (creado_por_admin IN (0, 1)), -- alta manual (sección 9)
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_hoteles_pais ON hoteles(pais);
CREATE INDEX IF NOT EXISTS idx_hoteles_ciudad ON hoteles(ciudad);
CREATE INDEX IF NOT EXISTS idx_hoteles_activo ON hoteles(activo);

-- Habitaciones de cada hotel. Un hotel necesita >= 4 para poder activarse.
CREATE TABLE IF NOT EXISTS habitaciones (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  hotel_id              INTEGER NOT NULL REFERENCES hoteles(id) ON DELETE CASCADE,
  descripcion           TEXT NOT NULL,
  tipo_bano             TEXT NOT NULL,
  tamano_cama           TEXT NOT NULL,
  capacidad_huespedes   INTEGER NOT NULL CHECK (capacidad_huespedes > 0),
  precio                REAL,
  fotos                 TEXT,                 -- JSON array de URLs (texto plano en SQLite)
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_habitaciones_hotel_id ON habitaciones(hotel_id);

-- Contenido de la pestaña /destinos, por país/ciudad. Resumen propio + backlink (nunca copiar texto textual).
CREATE TABLE IF NOT EXISTS destinos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  pais            TEXT NOT NULL,
  ciudad          TEXT NOT NULL,
  titulo          TEXT NOT NULL,
  resumen         TEXT NOT NULL,               -- contenido propio, no copiado
  fuente_url      TEXT NOT NULL,               -- backlink a la fuente original
  fuente_nombre   TEXT,
  origen          TEXT NOT NULL DEFAULT 'auto' CHECK (origen IN ('auto', 'manual')), -- 'auto' = generado por el refresh de cache, 'manual' = curado a mano y protegido de sobreescritura
  actualizado_at  TEXT NOT NULL DEFAULT (datetime('now')),  -- para cache periódico
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (pais, ciudad, titulo)
);

CREATE INDEX IF NOT EXISTS idx_destinos_pais_ciudad ON destinos(pais, ciudad);
