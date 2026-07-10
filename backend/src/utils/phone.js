// wa.me solo acepta digitos (sin "+", espacios ni guiones).
function normalizePhone(value) {
  return typeof value === 'string' ? value.replace(/\D/g, '') : '';
}

module.exports = { normalizePhone };
