const db = require('../config/database');
const HttpError = require('../utils/httpError');
const { isNonEmptyString, isPositiveInteger, isNonNegativeNumber } = require('../utils/validation');

function habitacionShape(row) {
  return {
    id: row.id,
    hotel_id: row.hotel_id,
    descripcion: row.descripcion,
    tipo_bano: row.tipo_bano,
    tamano_cama: row.tamano_cama,
    capacidad_huespedes: row.capacidad_huespedes,
    precio: row.precio,
    fotos: row.fotos ? JSON.parse(row.fotos) : [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function getOwnedOrThrow(id, hotelId) {
  const row = db.prepare('SELECT * FROM habitaciones WHERE id = ?').get(id);
  if (!row || row.hotel_id !== hotelId) {
    throw new HttpError(404, 'Habitacion no encontrada');
  }
  return row;
}

async function list(req, res) {
  const rows = db
    .prepare('SELECT * FROM habitaciones WHERE hotel_id = ? ORDER BY id ASC')
    .all(req.auth.hotelId);
  res.json({ habitaciones: rows.map(habitacionShape) });
}

async function create(req, res) {
  const {
    descripcion, tipo_bano: tipoBano, tamano_cama: tamanoCama,
    capacidad_huespedes: capacidadHuespedes, precio, fotos,
  } = req.body || {};

  if (!isNonEmptyString(descripcion) || !isNonEmptyString(tipoBano) || !isNonEmptyString(tamanoCama)) {
    throw new HttpError(400, 'descripcion, tipo_bano y tamano_cama son obligatorios');
  }
  if (!isPositiveInteger(capacidadHuespedes)) {
    throw new HttpError(400, 'capacidad_huespedes debe ser un entero positivo');
  }
  if (precio !== undefined && precio !== null && !isNonNegativeNumber(precio)) {
    throw new HttpError(400, 'precio debe ser un numero >= 0');
  }
  if (fotos !== undefined && !Array.isArray(fotos)) {
    throw new HttpError(400, 'fotos debe ser un arreglo de URLs');
  }

  const info = db
    .prepare(`INSERT INTO habitaciones
      (hotel_id, descripcion, tipo_bano, tamano_cama, capacidad_huespedes, precio, fotos)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(
      req.auth.hotelId, descripcion, tipoBano, tamanoCama, capacidadHuespedes,
      precio ?? null, fotos ? JSON.stringify(fotos) : null,
    );

  const row = db.prepare('SELECT * FROM habitaciones WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ habitacion: habitacionShape(row) });
}

async function update(req, res) {
  const id = Number(req.params.id);
  const existing = getOwnedOrThrow(id, req.auth.hotelId);

  const {
    descripcion, tipo_bano: tipoBano, tamano_cama: tamanoCama,
    capacidad_huespedes: capacidadHuespedes, precio, fotos,
  } = req.body || {};

  if (descripcion !== undefined && !isNonEmptyString(descripcion)) {
    throw new HttpError(400, 'descripcion invalida');
  }
  if (tipoBano !== undefined && !isNonEmptyString(tipoBano)) {
    throw new HttpError(400, 'tipo_bano invalido');
  }
  if (tamanoCama !== undefined && !isNonEmptyString(tamanoCama)) {
    throw new HttpError(400, 'tamano_cama invalido');
  }
  if (capacidadHuespedes !== undefined && !isPositiveInteger(capacidadHuespedes)) {
    throw new HttpError(400, 'capacidad_huespedes debe ser un entero positivo');
  }
  if (precio !== undefined && precio !== null && !isNonNegativeNumber(precio)) {
    throw new HttpError(400, 'precio debe ser un numero >= 0');
  }
  if (fotos !== undefined && fotos !== null && !Array.isArray(fotos)) {
    throw new HttpError(400, 'fotos debe ser un arreglo de URLs');
  }

  db.prepare(`UPDATE habitaciones SET
      descripcion = ?, tipo_bano = ?, tamano_cama = ?, capacidad_huespedes = ?,
      precio = ?, fotos = ?, updated_at = datetime('now')
    WHERE id = ?`)
    .run(
      descripcion ?? existing.descripcion,
      tipoBano ?? existing.tipo_bano,
      tamanoCama ?? existing.tamano_cama,
      capacidadHuespedes ?? existing.capacidad_huespedes,
      precio !== undefined ? precio : existing.precio,
      fotos !== undefined ? (fotos ? JSON.stringify(fotos) : null) : existing.fotos,
      id,
    );

  const row = db.prepare('SELECT * FROM habitaciones WHERE id = ?').get(id);
  res.json({ habitacion: habitacionShape(row) });
}

async function remove(req, res) {
  const id = Number(req.params.id);
  getOwnedOrThrow(id, req.auth.hotelId);

  db.prepare('DELETE FROM habitaciones WHERE id = ?').run(id);
  res.status(204).send();
}

module.exports = { list, create, update, remove };
