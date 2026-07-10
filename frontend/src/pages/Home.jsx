import { useEffect, useState } from 'react';
import { getHoteles } from '../api/client';
import BannerCarousel from '../components/BannerCarousel';
import HotelFilters from '../components/HotelFilters';
import HotelList from '../components/HotelList';

const FILTROS_VACIOS = {
  pais: '', ciudad: '', precio_min: '', precio_max: '',
};

export default function Home() {
  const [hotelesTodos, setHotelesTodos] = useState([]);
  const [hoteles, setHoteles] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Lista completa (sin filtros) una sola vez, para armar las opciones de pais/ciudad.
  useEffect(() => {
    getHoteles()
      .then((data) => setHotelesTodos(data.hoteles))
      .catch(() => setHotelesTodos([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const timeoutId = setTimeout(() => {
      getHoteles(filtros)
        .then((data) => {
          if (!cancelled) {
            setHoteles(data.hoteles);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err.message || 'No se pudieron cargar los hoteles.');
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [filtros]);

  return (
    <>
      <BannerCarousel />

      <div className="container home-section">
        <h1 className="visually-hidden">Hoteles</h1>
        <HotelFilters hotelesTodos={hotelesTodos} filtros={filtros} onChange={setFiltros} />
        <HotelList hoteles={hoteles} loading={loading} error={error} />
      </div>
    </>
  );
}
