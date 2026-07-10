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

async function listDestinos(req, res) {
  const { pais, ciudad } = req.query;
  const clauses = [];
  const params = [];

  if (pais) {
    clauses.push('pais = ?');
    params.push(pais);
  }
  if (ciudad) {
    clauses.push('ciudad = ?');
    params.push(ciudad);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const sql = `SELECT id, pais, ciudad, titulo, resumen, fuente_url, fuente_nombre, actualizado_at
    FROM destinos
    ${where}
    ORDER BY pais COLLATE NOCASE ASC, ciudad COLLATE NOCASE ASC, titulo COLLATE NOCASE ASC`;

  const rows = db.prepare(sql).all(...params);
  res.json({ destinos: rows });
}

async function getBannerActivo(req, res) {
  const banner = db.prepare('SELECT * FROM banner_destacado WHERE activo = 1 LIMIT 1').get();

  if (!banner) {
    return res.json({ banner: null });
  }

  const imagenes = db
    .prepare('SELECT url FROM banner_imagenes WHERE banner_id = ? ORDER BY orden ASC, id ASC')
    .all(banner.id)
    .map((row) => row.url);

  return res.json({
    banner: {
      id: banner.id,
      titulo: banner.titulo,
      descripcion: banner.descripcion,
      link: banner.link,
      imagenes,
    },
  });
}

module.exports = { listHoteles, listDestinos, getBannerActivo };
