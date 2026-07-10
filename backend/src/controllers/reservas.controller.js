const db = require('../config/database');
const HttpError = require('../utils/httpError');
const {
  isNonEmptyString, isPositiveInteger, isValidDateString,
} = require('../utils/validation');
const { normalizePhone } = require('../utils/phone');

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

async function crearReserva(req, res) {
  const { slug } = req.params;
  const {
    nombre, habitacion_id: habitacionId, fecha_entrada: fechaEntrada,
    fecha_salida: fechaSalida, huespedes,
  } = req.body || {};

  const hotel = db.prepare('SELECT * FROM hoteles WHERE slug = ?').get(slug);
  if (!hotel) {
    throw new HttpError(404, 'Hotel no encontrado');
  }

  if (!isNonEmptyString(nombre)) {
    throw new HttpError(400, 'nombre es obligatorio');
  }
  if (!isPositiveInteger(habitacionId)) {
    throw new HttpError(400, 'habitacion_id es obligatorio y debe ser un entero positivo');
  }
  if (!isValidDateString(fechaEntrada) || !isValidDateString(fechaSalida)) {
    throw new HttpError(400, 'fecha_entrada y fecha_salida deben tener formato YYYY-MM-DD y ser fechas validas');
  }
  if (!isPositiveInteger(huespedes)) {
    throw new HttpError(400, 'huespedes debe ser un entero positivo');
  }

  const hoy = todayStr();
  if (fechaEntrada < hoy) {
    throw new HttpError(400, 'fecha_entrada no puede ser una fecha pasada');
  }
  if (fechaSalida <= fechaEntrada) {
    throw new HttpError(400, 'fecha_salida debe ser posterior a fecha_entrada');
  }

  const habitacion = db.prepare('SELECT * FROM habitaciones WHERE id = ?').get(habitacionId);
  if (!habitacion || habitacion.hotel_id !== hotel.id) {
    throw new HttpError(404, 'Habitacion no encontrada en este hotel');
  }

  if (huespedes > habitacion.capacidad_huespedes) {
    throw new HttpError(400, `La habitacion admite un maximo de ${habitacion.capacidad_huespedes} huesped(es)`);
  }

  const telefono = normalizePhone(hotel.whatsapp_numero);
  if (!telefono) {
    throw new HttpError(400, 'Este hotel no tiene un numero de WhatsApp configurado');
  }

  const mensaje = `Hola, mi nombre es ${nombre}. Quiero reservar la habitacion "${habitacion.descripcion}" `
    + `en ${hotel.nombre} del ${fechaEntrada} al ${fechaSalida} para ${huespedes} huesped(es).`;
  const whatsappUrl = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

  res.json({
    whatsapp_url: whatsappUrl,
    mensaje,
    hotel: { id: hotel.id, slug: hotel.slug, nombre: hotel.nombre },
    habitacion: {
      id: habitacion.id, descripcion: habitacion.descripcion, capacidad_huespedes: habitacion.capacidad_huespedes,
    },
  });
}

module.exports = { crearReserva };
