const db = require('../config/database');
const HttpError = require('../utils/httpError');

const MIN_HABITACIONES = 4;

async function activar(req, res) {
  const hotel = db.prepare('SELECT * FROM hoteles WHERE id = ?').get(req.auth.hotelId);
  if (!hotel) {
    throw new HttpError(404, 'Hotel no encontrado');
  }

  const { count } = db
    .prepare('SELECT COUNT(*) AS count FROM habitaciones WHERE hotel_id = ?')
    .get(hotel.id);

  if (count < MIN_HABITACIONES) {
    throw new HttpError(
      400,
      `Faltan ${MIN_HABITACIONES - count} habitacion(es) para poder activarse (minimo ${MIN_HABITACIONES})`,
    );
  }

  db.prepare(`UPDATE hoteles SET activo = 1, updated_at = datetime('now') WHERE id = ?`).run(hotel.id);
  res.json({ activo: true, habitaciones_count: count });
}

async function desactivar(req, res) {
  const hotel = db.prepare('SELECT * FROM hoteles WHERE id = ?').get(req.auth.hotelId);
  if (!hotel) {
    throw new HttpError(404, 'Hotel no encontrado');
  }

  db.prepare(`UPDATE hoteles SET activo = 0, updated_at = datetime('now') WHERE id = ?`).run(hotel.id);
  res.json({ activo: false });
}

module.exports = { activar, desactivar, MIN_HABITACIONES };
