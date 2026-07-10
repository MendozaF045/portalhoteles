const db = require('../config/database');
const HttpError = require('../utils/httpError');
const { isNonEmptyString, isValidUrl } = require('../utils/validation');

function getImagenes(bannerId) {
  return db
    .prepare('SELECT url FROM banner_imagenes WHERE banner_id = ? ORDER BY orden ASC, id ASC')
    .all(bannerId)
    .map((row) => row.url);
}

function bannerShape(row) {
  return {
    id: row.id,
    titulo: row.titulo,
    descripcion: row.descripcion,
    link: row.link,
    activo: !!row.activo,
    imagenes: getImagenes(row.id),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function validateImagenes(imagenes) {
  if (!Array.isArray(imagenes) || imagenes.length === 0) {
    throw new HttpError(400, 'imagenes debe ser un arreglo con al menos una URL');
  }
  imagenes.forEach((url) => {
    if (!isValidUrl(url)) {
      throw new HttpError(400, `imagenes contiene una URL invalida: ${url}`);
    }
  });
}

function insertImagenes(bannerId, imagenes) {
  const insert = db.prepare('INSERT INTO banner_imagenes (banner_id, url, orden) VALUES (?, ?, ?)');
  imagenes.forEach((url, index) => insert.run(bannerId, url, index));
}

async function list(req, res) {
  const rows = db.prepare('SELECT * FROM banner_destacado ORDER BY created_at DESC').all();
  res.json({ banners: rows.map(bannerShape) });
}

async function create(req, res) {
  const {
    titulo, descripcion, link, imagenes,
  } = req.body || {};

  if (!isNonEmptyString(titulo) || !isNonEmptyString(link)) {
    throw new HttpError(400, 'titulo y link son obligatorios');
  }
  validateImagenes(imagenes);

  const crear = db.transaction(() => {
    const info = db
      .prepare('INSERT INTO banner_destacado (titulo, descripcion, link) VALUES (?, ?, ?)')
      .run(titulo, descripcion || null, link);
    insertImagenes(info.lastInsertRowid, imagenes);
    return info.lastInsertRowid;
  });

  const bannerId = crear();
  const row = db.prepare('SELECT * FROM banner_destacado WHERE id = ?').get(bannerId);
  res.status(201).json({ banner: bannerShape(row) });
}

async function update(req, res) {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM banner_destacado WHERE id = ?').get(id);
  if (!existing) {
    throw new HttpError(404, 'Banner no encontrado');
  }

  const {
    titulo, descripcion, link, imagenes,
  } = req.body || {};

  if (titulo !== undefined && !isNonEmptyString(titulo)) throw new HttpError(400, 'titulo invalido');
  if (link !== undefined && !isNonEmptyString(link)) throw new HttpError(400, 'link invalido');
  if (imagenes !== undefined) validateImagenes(imagenes);

  const actualizar = db.transaction(() => {
    db.prepare(`UPDATE banner_destacado SET
        titulo = ?, descripcion = ?, link = ?, updated_at = datetime('now')
      WHERE id = ?`)
      .run(
        titulo ?? existing.titulo,
        descripcion !== undefined ? descripcion : existing.descripcion,
        link ?? existing.link,
        id,
      );

    if (imagenes !== undefined) {
      db.prepare('DELETE FROM banner_imagenes WHERE banner_id = ?').run(id);
      insertImagenes(id, imagenes);
    }
  });

  actualizar();
  const row = db.prepare('SELECT * FROM banner_destacado WHERE id = ?').get(id);
  res.json({ banner: bannerShape(row) });
}

async function remove(req, res) {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT id FROM banner_destacado WHERE id = ?').get(id);
  if (!existing) {
    throw new HttpError(404, 'Banner no encontrado');
  }

  db.prepare('DELETE FROM banner_destacado WHERE id = ?').run(id);
  res.status(204).send();
}

async function activar(req, res) {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT id FROM banner_destacado WHERE id = ?').get(id);
  if (!existing) {
    throw new HttpError(404, 'Banner no encontrado');
  }

  const activarUnico = db.transaction(() => {
    db.prepare(`UPDATE banner_destacado SET activo = 0, updated_at = datetime('now') WHERE activo = 1`).run();
    db.prepare(`UPDATE banner_destacado SET activo = 1, updated_at = datetime('now') WHERE id = ?`).run(id);
  });

  activarUnico();
  const row = db.prepare('SELECT * FROM banner_destacado WHERE id = ?').get(id);
  res.json({ banner: bannerShape(row) });
}

async function desactivar(req, res) {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT id FROM banner_destacado WHERE id = ?').get(id);
  if (!existing) {
    throw new HttpError(404, 'Banner no encontrado');
  }

  db.prepare(`UPDATE banner_destacado SET activo = 0, updated_at = datetime('now') WHERE id = ?`).run(id);
  const row = db.prepare('SELECT * FROM banner_destacado WHERE id = ?').get(id);
  res.json({ banner: bannerShape(row) });
}

module.exports = {
  list, create, update, remove, activar, desactivar, bannerShape,
};
