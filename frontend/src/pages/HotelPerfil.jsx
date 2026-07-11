import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getHotelPublico } from '../api/client';
import { getCountryFlag } from '../utils/countryFlags';
import HotelNoEncontrado from '../components/hotel-perfil/HotelNoEncontrado';
import ReservaForm from '../components/hotel-perfil/ReservaForm';

export default function HotelPerfil() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    getHotelPublico(slug)
      .then((res) => {
        if (!cancelled) {
          setData(res);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNotFound(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return <div className="container page-placeholder"><p>Cargando...</p></div>;
  }

  if (notFound || !data) {
    return <HotelNoEncontrado />;
  }

  const { hotel, habitaciones } = data;

  return (
    <div className="container hotel-perfil">
      <div className="hotel-perfil__header">
        <div className="hotel-perfil__logo-wrap">
          {hotel.logo_url ? (
            <img src={hotel.logo_url} alt={hotel.nombre} className="hotel-perfil__logo" />
          ) : (
            <div className="hotel-perfil__logo hotel-perfil__logo--placeholder" aria-hidden="true">
              {hotel.nombre.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <h1>
            {hotel.nombre} <span className="hotel-perfil__flag" title={hotel.pais}>{getCountryFlag(hotel.pais)}</span>
          </h1>
          <p className="hotel-perfil__ubicacion">{hotel.ciudad}, {hotel.pais}</p>
          {hotel.website_url && (
            <a href={hotel.website_url} target="_blank" rel="noopener noreferrer">
              Visitar sitio web
            </a>
          )}
        </div>
      </div>

      {hotel.descripcion && <p className="hotel-perfil__descripcion">{hotel.descripcion}</p>}

      <section className="panel-section card">
        <h2>Habitaciones disponibles</h2>
        {habitaciones.length === 0 ? (
          <p>Este hotel todavia no cargo habitaciones.</p>
        ) : (
          <ul className="panel-habitaciones__lista">
            {habitaciones.map((hab) => (
              <li key={hab.id} className="panel-habitacion">
                <div className="panel-habitacion__info">
                  <p className="panel-habitacion__descripcion">{hab.descripcion}</p>
                  <p className="panel-habitacion__detalle">
                    Bano {hab.tipo_bano} · Cama {hab.tamano_cama} · Hasta {hab.capacidad_huespedes}
                    {' '}
                    huesped{hab.capacidad_huespedes === 1 ? '' : 'es'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {habitaciones.length > 0 && (
        <section className="panel-section card">
          <h2>Reservar</h2>
          <ReservaForm slug={slug} habitaciones={habitaciones} />
        </section>
      )}
    </div>
  );
}
