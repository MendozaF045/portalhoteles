const db = require('../config/database');
const HttpError = require('../utils/httpError');
const { hashPassword } = require('../utils/password');
const { generateUniqueSlug } = require('../utils/slug');
const { isValidEmail, isNonEmptyString } = require('../utils/validation');
const { hotelPublicShape } = require('./authHotel.controller');

async function listActivos(req, res) {
  const rows = db.prepare('SELECT * FROM hoteles WHERE activo = 1 ORDER BY nombre COLLATE NOCASE ASC').all();
  res.json({ hoteles: rows.map(hotelPublicShape) });
}

async function listInactivos(req, res) {
  const rows = db.prepare('SELECT * FROM hoteles WHERE activo = 0 ORDER BY nombre COLLATE NOCASE ASC').all();
  res.json({ hoteles: rows.map(hotelPublicShape) });
}

async function addHotel(req, res) {
  const {
    nombre, pais, ciudad, descripcion, website_url: websiteUrl,
    whatsapp_numero: whatsappNumero, logo_url: logoUrl, precio_referencia: precioReferencia,
    email, password,
  } = req.body || {};

  if (!isNonEmptyString(nombre) || !isNonEmptyString(pais) || !isNonEmptyString(ciudad)) {
    throw new HttpError(400, 'nombre, pais y ciudad son obligatorios');
  }

  const crearLogin = email !== undefined || password !== undefined;
  if (crearLogin) {
    if (!isValidEmail(email)) {
      throw new HttpError(400, 'email invalido');
    }
    if (typeof password !== 'string' || password.length < 6) {
      throw new HttpError(400, 'password debe tener al menos 6 caracteres');
    }
    const existing = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
    if (existing) {
      throw new HttpError(409, 'Ya existe una cuenta con ese email');
    }
  }

  const passwordHash = crearLogin ? await hashPassword(password) : null;
  const slug = generateUniqueSlug(db, nombre);

  const crear = db.transaction(() => {
    let usuarioId = null;
    if (crearLogin) {
      const usuarioInfo = db
        .prepare('INSERT INTO usuarios (email, password_hash) VALUES (?, ?)')
        .run(email, passwordHash);
      usuarioId = usuarioInfo.lastInsertRowid;
    }

    const hotelInfo = db
      .prepare(`INSERT INTO hoteles
        (usuario_id, slug, nombre, logo_url, pais, ciudad, descripcion, website_url, whatsapp_numero, precio_referencia, creado_por_admin)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`)
      .run(
        usuarioId, slug, nombre, logoUrl || null, pais, ciudad,
        descripcion || null, websiteUrl || null, whatsappNumero || null,
        typeof precioReferencia === 'number' ? precioReferencia : null,
      );

    return hotelInfo.lastInsertRowid;
  });

  const hotelId = crear();
  const hotel = db.prepare('SELECT * FROM hoteles WHERE id = ?').get(hotelId);
  res.status(201).json({ hotel: hotelPublicShape(hotel) });
}

async function deleteHotel(req, res) {
  const id = Number(req.params.id);
  const hotel = db.prepare('SELECT * FROM hoteles WHERE id = ?').get(id);

  if (!hotel) {
    throw new HttpError(404, 'Hotel no encontrado');
  }

  const eliminar = db.transaction(() => {
    db.prepare('DELETE FROM hoteles WHERE id = ?').run(id); // cascada elimina sus habitaciones
    if (hotel.usuario_id) {
      db.prepare('DELETE FROM usuarios WHERE id = ?').run(hotel.usuario_id);
    }
  });

  eliminar();
  res.status(204).send();
}

module.exports = {
  listActivos, listInactivos, addHotel, deleteHotel,
};
