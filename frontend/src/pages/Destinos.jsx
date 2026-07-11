import { useEffect, useState } from 'react';
import { getDestinos } from '../api/client';
import DestinoFilters from '../components/DestinoFilters';
import DestinoCard from '../components/DestinoCard';

const FILTROS_VACIOS = { pais: '', ciudad: '' };

export default function Destinos() {
  const [destinosTodos, setDestinosTodos] = useState([]);
  const [destinos, setDestinos] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Lista completa (sin filtros) una sola vez, para armar las opciones de pais/ciudad.
  useEffect(() => {
    getDestinos()
      .then((data) => setDestinosTodos(data.destinos))
      .catch(() => setDestinosTodos([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const timeoutId = setTimeout(() => {
      getDestinos(filtros)
        .then((data) => {
          if (!cancelled) {
            setDestinos(data.destinos);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err.message || 'No se pudieron cargar los destinos.');
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [filtros]);

  return (
    <div className="container home-section">
      <h1>Destinos</h1>
      <p className="page-intro">
        Lugares para visitar y planes locales en los paises y ciudades donde tenemos hoteles registrados.
      </p>

      <DestinoFilters destinosTodos={destinosTodos} filtros={filtros} onChange={setFiltros} />

      {loading && <p className="hotel-list__status">Cargando destinos...</p>}
      {!loading && error && <p className="hotel-list__status hotel-list__status--error">{error}</p>}
      {!loading && !error && destinos.length === 0 && (
        <p className="hotel-list__status">No hay destinos cargados con esos filtros todavia.</p>
      )}
      {!loading && !error && destinos.length > 0 && (
        <div className="destinos-list">
          {destinos.map((destino) => (
            <DestinoCard key={destino.id} destino={destino} />
          ))}
        </div>
      )}
    </div>
  );
}
