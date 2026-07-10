const crypto = require('node:crypto');
const db = require('../config/database');
const HttpError = require('../utils/httpError');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const { generateUniqueSlug } = require('../utils/slug');
const { isValidEmail, isNonEmptyString } = require('../utils/validation');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

function hotelPublicShape(hotel) {
  return {
    id: hotel.id,
    slug: hotel.slug,
    nombre: hotel.nombre,
    logo_url: hotel.logo_url,
    pais: hotel.pais,
    ciudad: hotel.ciudad,
    descripcion: hotel.descripcion,
    website_url: hotel.website_url,
    whatsapp_numero: hotel.whatsapp_numero,
    precio_referencia: hotel.precio_referencia,
    activo: !!hotel.activo,
    created_at: hotel.created_at,
  };
}

async function registro(req, res) {
  const {
    nombre, pais, ciudad, email, password,
    descripcion, website_url: websiteUrl, whatsapp_numero: whatsappNumero,
    logo_url: logoUrl, precio_referencia: precioReferencia,
  } = req.body || {};

  if (!isNonEmptyString(nombre) || !isNonEmptyString(pais) || !isNonEmptyString(ciudad)) {
    throw new HttpError(400, 'nombre, pais y ciudad son obligatorios');
  }
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

  const passwordHash = await hashPassword(password);
  const slug = generateUniqueSlug(db, nombre);

  const crearHotel = db.transaction(() => {
    const usuarioInfo = db
      .prepare('INSERT INTO usuarios (email, password_hash) VALUES (?, ?)')
      .run(email, passwordHash);
    const usuarioId = usuarioInfo.lastInsertRowid;

    const hotelInfo = db
      .prepare(`INSERT INTO hoteles
        (usuario_id, slug, nombre, logo_url, pais, ciudad, descripcion, website_url, whatsapp_numero, precio_referencia)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(
        usuarioId, slug, nombre, logoUrl || null, pais, ciudad,
        descripcion || null, websiteUrl || null, whatsappNumero || null,
        typeof precioReferencia === 'number' ? precioReferencia : null,
      );

    return { usuarioId, hotelId: hotelInfo.lastInsertRowid };
  });

  const { usuarioId, hotelId } = crearHotel();
  const hotel = db.prepare('SELECT * FROM hoteles WHERE id = ?').get(hotelId);
  const token = signToken({ role: 'hotel', hotelId, usuarioId });

  res.status(201).json({ token, hotel: hotelPublicShape(hotel) });
}

async function login(req, res) {
  const { email, password } = req.body || {};

  if (!isValidEmail(email) || typeof password !== 'string' || password.length === 0) {
    throw new HttpError(400, 'email y password son obligatorios');
  }

  const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
  if (!usuario) {
    throw new HttpError(401, 'Credenciales invalidas');
  }

  const valid = await comparePassword(password, usuario.password_hash);
  if (!valid) {
    throw new HttpError(401, 'Credenciales invalidas');
  }

  const hotel = db.prepare('SELECT * FROM hoteles WHERE usuario_id = ?').get(usuario.id);
  if (!hotel) {
    throw new HttpError(500, 'La cuenta no tiene un hotel asociado');
  }

  const token = signToken({ role: 'hotel', hotelId: hotel.id, usuarioId: usuario.id });
  res.json({ token, hotel: hotelPublicShape(hotel) });
}

async function forgotPassword(req, res) {
  const { email } = req.body || {};

  if (!isValidEmail(email)) {
    throw new HttpError(400, 'email invalido');
  }

  const usuario = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);

  const respuestaGenerica = {
    message: 'Si el email existe, se enviaran instrucciones para restablecer la contrasena',
  };

  if (!usuario) {
    return res.json(respuestaGenerica);
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();

  db.prepare(`UPDATE usuarios SET reset_token = ?, reset_token_expires_at = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(resetToken, expiresAt, usuario.id);

  return res.json({
    ...respuestaGenerica,
    dev_note: 'No hay servicio de email configurado todavia; el token se devuelve aqui solo para pruebas.',
    resetToken,
    resetTokenExpiresAt: expiresAt,
  });
}

async function resetPassword(req, res) {
  const { token, password } = req.body || {};

  if (!isNonEmptyString(token)) {
    throw new HttpError(400, 'token es obligatorio');
  }
  if (typeof password !== 'string' || password.length < 6) {
    throw new HttpError(400, 'password debe tener al menos 6 caracteres');
  }

  const usuario = db.prepare('SELECT * FROM usuarios WHERE reset_token = ?').get(token);
  if (!usuario || !usuario.reset_token_expires_at) {
    throw new HttpError(400, 'Token invalido o expirado');
  }
  if (new Date(usuario.reset_token_expires_at).getTime() < Date.now()) {
    throw new HttpError(400, 'Token invalido o expirado');
  }

  const passwordHash = await hashPassword(password);
  db.prepare(`UPDATE usuarios
    SET password_hash = ?, reset_token = NULL, reset_token_expires_at = NULL, updated_at = datetime('now')
    WHERE id = ?`).run(passwordHash, usuario.id);

  res.json({ message: 'Contrasena actualizada correctamente' });
}

async function getMe(req, res) {
  const hotel = db.prepare('SELECT * FROM hoteles WHERE id = ?').get(req.auth.hotelId);
  if (!hotel) {
    throw new HttpError(404, 'Hotel no encontrado');
  }

  const { count } = db
    .prepare('SELECT COUNT(*) AS count FROM habitaciones WHERE hotel_id = ?')
    .get(hotel.id);

  const MIN_HABITACIONES = 4;

  res.json({
    hotel: hotelPublicShape(hotel),
    habitaciones_count: count,
    habitaciones_requeridas: MIN_HABITACIONES,
    puede_activarse: count >= MIN_HABITACIONES,
  });
}

module.exports = {
  registro, login, forgotPassword, resetPassword, getMe, hotelPublicShape,
};
