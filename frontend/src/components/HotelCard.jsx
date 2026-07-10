import { Link } from 'react-router-dom';
import { getCountryFlag } from '../utils/countryFlags';

function formatPrecio(precio) {
  if (precio === null || precio === undefined) {
    return null;
  }
  return new Intl.NumberFormat('es', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(precio);
}

export default function HotelCard({ hotel }) {
  const precio = formatPrecio(hotel.precio_referencia);

  return (
    <Link to={`/${hotel.slug}`} className="hotel-card card">
      <div className="hotel-card__image-wrap">
        {hotel.logo_url ? (
          <img src={hotel.logo_url} alt={hotel.nombre} className="hotel-card__image" />
        ) : (
          <div className="hotel-card__image hotel-card__image--placeholder" aria-hidden="true">
            {hotel.nombre.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="hotel-card__flag" title={hotel.pais}>
          {getCountryFlag(hotel.pais)}
        </span>
      </div>

      <div className="hotel-card__body">
        <h3 className="hotel-card__name">{hotel.nombre}</h3>
        <p className="hotel-card__location">{hotel.ciudad}, {hotel.pais}</p>
        {precio && <p className="hotel-card__price">Desde {precio}</p>}
      </div>
    </Link>
  );
}
