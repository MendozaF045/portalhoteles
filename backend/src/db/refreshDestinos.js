require('dotenv').config();

const db = require('../config/database');
const { refreshDestinos } = require('../services/destinosRefresh');

const { paresProcesados, entradasActualizadas } = refreshDestinos(db);

console.log(
  `Refresco simulado de destinos completado: ${entradasActualizadas}/${paresProcesados} `
  + 'entradas actualizadas (por cada pais/ciudad con hoteles registrados). '
  + 'Las entradas curadas manualmente (origen = manual) no se modifican.',
);
