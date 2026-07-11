// Misma nocion de "hoy" que usa el backend (utils/validation.js via reservas.controller.js#todayStr)
// para que la validacion del cliente y la del servidor coincidan.
export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
