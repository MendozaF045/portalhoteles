const db = require('../config/database');
const HttpError = require('../utils/httpError');
const { isNonEmptyString, isValidEmail } = require('../utils/validation');

async function crear(req, res) {
  const {
    nombre, email, asunto, mensaje,
  } = req.body || {};

  if (!isNonEmptyString(nombre)) {
    throw new HttpError(400, 'nombre es obligatorio');
  }
  if (!isValidEmail(email)) {
    throw new HttpError(400, 'email invalido');
  }
  if (!isNonEmptyString(mensaje)) {
    throw new HttpError(400, 'mensaje es obligatorio');
  }

  const info = db
    .prepare('INSERT INTO contactos (nombre, email, asunto, mensaje) VALUES (?, ?, ?, ?)')
    .run(nombre, email, asunto || null, mensaje);

  // No hay servicio de email real todavia: se simula el envio con un log del servidor.
  console.log(`[email simulado] Nuevo mensaje de contacto #${info.lastInsertRowid} de ${nombre} <${email}>`);

  res.status(201).json({
    message: 'Mensaje recibido correctamente',
    dev_note: 'No hay envio de correo real configurado todavia; el mensaje se guarda en la base de datos y se loggea en la consola del servidor.',
    contacto_id: info.lastInsertRowid,
  });
}

async function list(req, res) {
  const rows = db.prepare('SELECT * FROM contactos ORDER BY created_at DESC').all();
  res.json({ contactos: rows });
}

module.exports = { crear, list };
