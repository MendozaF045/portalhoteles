const db = require('../config/database');
const HttpError = require('../utils/httpError');

async function listHoteles(req, res) {
  const {
    pais, ciudad, precio_min: precioMinRaw, precio_max: precioMaxRaw,
  } = req.query;

  const clauses = ['activo = 1'];
  const params = [];

  if (pais) {
    clauses.push('pais = ?');
    params.push(pais);
  }
  if (ciudad) {
    clauses.push('ciudad = ?');
    params.push(ciudad);
  }

  let precioMin;
  let precioMax;

  if (precioMinRaw !== undefined) {
    precioMin = Number(precioMinRaw);
    if (Number.isNaN(precioMin)) {
      throw new HttpError(400, 'precio_min debe ser numerico');
    }
    clauses.push('precio_referencia >= ?');
    params.push(precioMin);
  }
  if (precioMaxRaw !== undefined) {
    precioMax = Number(precioMaxRaw);
    if (Number.isNaN(precioMax)) {
      throw new HttpError(400, 'precio_max debe ser numerico');
    }
    clauses.push('precio_referencia <= ?');
    params.push(precioMax);
  }

  const sql = `SELECT id, slug, nombre, logo_url, pais, ciudad, precio_referencia
    FROM hoteles
    WHERE ${clauses.join(' AND ')}
    ORDER BY nombre COLLATE NOCASE ASC`;

  const rows = db.prepare(sql).all(...params);
  res.json({ hoteles: rows });
}

module.exports = { listHoteles };
