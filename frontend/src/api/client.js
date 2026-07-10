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
