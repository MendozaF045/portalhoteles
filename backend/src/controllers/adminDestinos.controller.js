const db = require('../config/database');
const HttpError = require('../utils/httpError');
const { isNonEmptyString, isValidUrl } = require('../utils/validation');
const { refreshDestinos } = require('../services/destinosRefresh');

function destinoShape(row) {
  return {
    id: row.id,
    pais: row.pais,
    ciudad: row.ciudad,
    titulo: row.titulo,
    resumen: row.resumen,
    fuente_url: row.fuente_url,
    fuente_nombre: row.fuente_nombre,
    origen: row.origen,
    actualizado_at: row.actualizado_at,
    created_at: row.created_at,
  };
}

async function list(req, res) {
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
  const rows = db
    .prepare(`SELECT * FROM destinos ${where} ORDER BY pais, ciudad, titulo`)
    .all(...params);

  res.json({ destinos: rows.map(destinoShape) });
}

async function create(req, res) {
  const {
    pais, ciudad, titulo, resumen, fuente_url: fuenteUrl, fuente_nombre: fuenteNombre,
  } = req.body || {};

  if (!isNonEmptyString(pais) || !isNonEmptyString(ciudad) || !isNonEmptyString(titulo) || !isNonEmptyString(resumen)) {
    throw new HttpError(400, 'pais, ciudad, titulo y resumen son obligatorios');
  }
  if (!isValidUrl(fuenteUrl)) {
    throw new HttpError(400, 'fuente_url debe ser una URL http(s) valida (el backlink a la fuente original)');
  }

  const existing = db
    .prepare('SELECT id FROM destinos WHERE pais = ? AND ciudad = ? AND titulo = ?')
    .get(pais, ciudad, titulo);
  if (existing) {
    throw new HttpError(409, 'Ya existe una entrada de destino con ese pais, ciudad y titulo');
  }

  const info = db
    .prepare(`INSERT INTO destinos (pais, ciudad, titulo, resumen, fuente_url, fuente_nombre, origen, actualizado_at)
      VALUES (?, ?, ?, ?, ?, ?, 'manual', datetime('now'))`)
    .run(pais, ciudad, titulo, resumen, fuenteUrl, fuenteNombre || null);

  const row = db.prepare('SELECT * FROM destinos WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ destino: destinoShape(row) });
}

async function update(req, res) {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM destinos WHERE id = ?').get(id);
  if (!existing) {
    throw new HttpError(404, 'Destino no encontrado');
  }

  const {
    pais, ciudad, titulo, resumen, fuente_url: fuenteUrl, fuente_nombre: fuenteNombre,
  } = req.body || {};

  if (pais !== undefined && !isNonEmptyString(pais)) throw new HttpError(400, 'pais invalido');
  if (ciudad !== undefined && !isNonEmptyString(ciudad)) throw new HttpError(400, 'ciudad invalido');
  if (titulo !== undefined && !isNonEmptyString(titulo)) throw new HttpError(400, 'titulo invalido');
  if (resumen !== undefined && !isNonEmptyString(resumen)) throw new HttpError(400, 'resumen invalido');
  if (fuenteUrl !== undefined && !isValidUrl(fuenteUrl)) {
    throw new HttpError(400, 'fuente_url debe ser una URL http(s) valida');
  }

  const nuevoPais = pais ?? existing.pais;
  const nuevaCiudad = ciudad ?? existing.ciudad;
  const nuevoTitulo = titulo ?? existing.titulo;

  const conflicto = db
    .prepare('SELECT id FROM destinos WHERE pais = ? AND ciudad = ? AND titulo = ? AND id != ?')
    .get(nuevoPais, nuevaCiudad, nuevoTitulo, id);
  if (conflicto) {
    throw new HttpError(409, 'Ya existe otra entrada de destino con ese pais, ciudad y titulo');
  }

  db.prepare(`UPDATE destinos SET
      pais = ?, ciudad = ?, titulo = ?, resumen = ?, fuente_url = ?, fuente_nombre = ?,
      origen = 'manual', actualizado_at = datetime('now')
    WHERE id = ?`)
    .run(
      nuevoPais,
      nuevaCiudad,
      nuevoTitulo,
      resumen ?? existing.resumen,
      fuenteUrl ?? existing.fuente_url,
      fuenteNombre !== undefined ? fuenteNombre : existing.fuente_nombre,
      id,
    );

  const row = db.prepare('SELECT * FROM destinos WHERE id = ?').get(id);
  res.json({ destino: destinoShape(row) });
}

async function remove(req, res) {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT id FROM destinos WHERE id = ?').get(id);
  if (!existing) {
    throw new HttpError(404, 'Destino no encontrado');
  }

  db.prepare('DELETE FROM destinos WHERE id = ?').run(id);
  res.status(204).send();
}

async function refresh(req, res) {
  const resultado = refreshDestinos(db);
  res.json({
    message: 'Refresco simulado ejecutado (no se conecto a ninguna fuente externa real todavia)',
    ...resultado,
  });
}

module.exports = {
  list, create, update, remove, refresh, destinoShape,
};
