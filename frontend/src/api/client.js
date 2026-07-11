const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Error ${res.status}`);
  }

  return data;
}

function buildQuery(params) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null),
  ).toString();
  return query ? `?${query}` : '';
}

export function getHoteles(filtros = {}) {
  return request(`/public/hoteles${buildQuery(filtros)}`);
}

export function getBannerActivo() {
  return request('/public/banner');
}

export function getHotelPublico(slug) {
  return request(`/public/hoteles/${slug}`);
}

export function crearReserva(slug, datos) {
  return request(`/public/hoteles/${slug}/reservas`, { method: 'POST', body: JSON.stringify(datos) });
}

export function registrarHotel(datos) {
  return request('/auth/hotel/registro', { method: 'POST', body: JSON.stringify(datos) });
}

export function loginHotel(credenciales) {
  return request('/auth/hotel/login', { method: 'POST', body: JSON.stringify(credenciales) });
}

export function forgotPasswordHotel(datos) {
  return request('/auth/hotel/forgot-password', { method: 'POST', body: JSON.stringify(datos) });
}

export function resetPasswordHotel(datos) {
  return request('/auth/hotel/reset-password', { method: 'POST', body: JSON.stringify(datos) });
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getMisDatos(token) {
  return request('/hotel/me', { headers: authHeaders(token) });
}

export function actualizarMisDatos(token, datos) {
  return request('/hotel/me', { method: 'PUT', headers: authHeaders(token), body: JSON.stringify(datos) });
}

export function getMisHabitaciones(token) {
  return request('/hotel/habitaciones', { headers: authHeaders(token) });
}

export function crearHabitacion(token, datos) {
  return request('/hotel/habitaciones', { method: 'POST', headers: authHeaders(token), body: JSON.stringify(datos) });
}

export function actualizarHabitacion(token, id, datos) {
  return request(`/hotel/habitaciones/${id}`, { method: 'PUT', headers: authHeaders(token), body: JSON.stringify(datos) });
}

export function eliminarHabitacion(token, id) {
  return request(`/hotel/habitaciones/${id}`, { method: 'DELETE', headers: authHeaders(token) });
}

export function activarHotel(token) {
  return request('/hotel/activar', { method: 'POST', headers: authHeaders(token) });
}

export function desactivarHotel(token) {
  return request('/hotel/desactivar', { method: 'POST', headers: authHeaders(token) });
}
