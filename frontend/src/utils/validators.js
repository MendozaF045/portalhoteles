// Misma regla simple que usa el backend (utils/validation.js#isValidEmail) para dar
// feedback inmediato en el formulario antes de golpear la API.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  return typeof value === 'string' && EMAIL_REGEX.test(value);
}
