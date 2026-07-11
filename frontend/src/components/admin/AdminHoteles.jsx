import { useState } from 'react';
import { Link } from 'react-router-dom';
import { eliminarHotelAdmin } from '../../api/client';
import { getCountryFlag } from '../../utils/countryFlags';

function HotelRow({ hotel, token, onCambio }) {
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState('');

  const handleEliminar = async () => {
    if (!window.confirm(`¿Eliminar "${hotel.nombre}"? Esta accion no se puede deshacer.`)) {
      return;
    }
    setEliminando(true);
    setError('');
    try {
      await eliminarHotelAdmin(token, hotel.id);
      await onCambio();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el hotel.');
      setEliminando(false);
    }
  };

  return (
    <li className="panel-habitacion">
      <div className="panel-habitacion__info">
        <p className="panel-habitacion__descripcion">
          {getCountryFlag(hotel.pais)} {hotel.nombre}
        </p>
        <p className="panel-habitacion__detalle">
          {hotel.ciudad}, {hotel.pais} · <Link to={`/${hotel.slug}`}>/{hotel.slug}</Link>
        </p>
        {error && <p className="form-field__error">{error}</p>}
      </div>
      <div className="panel-habitacion__acciones">
        <button type="button" className="btn btn-outline" onClick={handleEliminar} disabled={eliminando}>
          {eliminando ? 'Eliminando...' : 'Eliminar'}
        </button>
      </div>
    </li>
  );
}

export default function AdminHoteles({
  token, hotelesActivos, hotelesInactivos, onCambio,
}) {
  return (
    <section className="panel-section card">
      <h2>Hoteles activos ({hotelesActivos.length})</h2>
      {hotelesActivos.length === 0 ? (
        <p className="panel-habitaciones__vacio">No hay hoteles activos todavia.</p>
      ) : (
        <ul className="panel-habitaciones__lista">
          {hotelesActivos.map((hotel) => (
            <HotelRow key={hotel.id} hotel={hotel} token={token} onCambio={onCambio} />
          ))}
        </ul>
      )}

      <h2 className="admin-hoteles__subtitulo">Hoteles inactivos ({hotelesInactivos.length})</h2>
      {hotelesInactivos.length === 0 ? (
        <p className="panel-habitaciones__vacio">No hay hoteles inactivos.</p>
      ) : (
        <ul className="panel-habitaciones__lista">
          {hotelesInactivos.map((hotel) => (
            <HotelRow key={hotel.id} hotel={hotel} token={token} onCambio={onCambio} />
          ))}
        </ul>
      )}
    </section>
  );
}
