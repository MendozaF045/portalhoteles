// El pais se guarda como texto libre (no hay codigo ISO en el backend todavia),
// asi que mapeamos nombres comunes en espanol a su codigo ISO 3166-1 alpha-2
// para poder mostrar la bandera como emoji sin depender de ningun servicio externo.
const COUNTRY_CODES = {
  argentina: 'AR',
  bolivia: 'BO',
  brasil: 'BR',
  canada: 'CA',
  chile: 'CL',
  colombia: 'CO',
  'costa rica': 'CR',
  cuba: 'CU',
  ecuador: 'EC',
  egipto: 'EG',
  'el salvador': 'SV',
  espana: 'ES',
  'estados unidos': 'US',
  francia: 'FR',
  alemania: 'DE',
  grecia: 'GR',
  guatemala: 'GT',
  honduras: 'HN',
  italia: 'IT',
  japon: 'JP',
  marruecos: 'MA',
  mexico: 'MX',
  nicaragua: 'NI',
  panama: 'PA',
  paraguay: 'PY',
  peru: 'PE',
  portugal: 'PT',
  'republica dominicana': 'DO',
  tailandia: 'TH',
  turquia: 'TR',
  uruguay: 'UY',
  venezuela: 'VE',
};

function normalize(value) {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function codeToFlagEmoji(code) {
  return code
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}

export function getCountryFlag(paisNombre) {
  if (!paisNombre) {
    return '🏳️';
  }
  const code = COUNTRY_CODES[normalize(paisNombre)];
  return code ? codeToFlagEmoji(code) : '🏳️';
}
