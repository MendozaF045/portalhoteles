const { slugify } = require('../utils/slug');

// Genera contenido placeholder mientras no haya una fuente externa real conectada.
// Debe quedar claro que es simulado: no se copia texto de ningun sitio, y el link
// no apunta a una fuente real todavia.
function buildSimulatedEntry(pais, ciudad) {
  const titulo = `Explora ${ciudad}, ${pais}`;
  const resumen = [
    `Contenido de ejemplo (modo simulado) sobre lugares para visitar y planes locales en ${ciudad}, ${pais}.`,
    'Este texto es un placeholder generado automaticamente, no proviene de ninguna fuente externa real todavia.',
    'Pendiente de reemplazar por un resumen editorial propio, con su respectivo backlink, cuando se conecte una fuente de datos real.',
  ].join(' ');
  const fuenteUrl = `https://fuente-simulada.example/destinos/${slugify(pais)}/${slugify(ciudad)}`;
  const fuenteNombre = 'Fuente simulada (pendiente de integracion real)';

  return {
    titulo, resumen, fuenteUrl, fuenteNombre,
  };
}

// Refresca (upsert) una entrada de destino por cada pais/ciudad donde haya hoteles
// registrados. Nunca sobreescribe entradas 'manual' (curadas a mano en el panel admin).
function refreshDestinos(db) {
  const ciudades = db.prepare('SELECT DISTINCT pais, ciudad FROM hoteles').all();

  const upsert = db.prepare(`
    INSERT INTO destinos (pais, ciudad, titulo, resumen, fuente_url, fuente_nombre, origen, actualizado_at)
    VALUES (@pais, @ciudad, @titulo, @resumen, @fuenteUrl, @fuenteNombre, 'auto', datetime('now'))
    ON CONFLICT (pais, ciudad, titulo) DO UPDATE SET
      resumen = excluded.resumen,
      fuente_url = excluded.fuente_url,
      fuente_nombre = excluded.fuente_nombre,
      actualizado_at = datetime('now')
    WHERE destinos.origen = 'auto'
  `);

  const run = db.transaction((rows) => {
    let entradasActualizadas = 0;
    rows.forEach(({ pais, ciudad }) => {
      const entry = buildSimulatedEntry(pais, ciudad);
      const info = upsert.run({
        pais, ciudad, ...entry,
      });
      if (info.changes > 0) {
        entradasActualizadas += 1;
      }
    });
    return { paresProcesados: rows.length, entradasActualizadas };
  });

  return run(ciudades);
}

module.exports = { refreshDestinos, buildSimulatedEntry };
