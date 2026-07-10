import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMisDatos } from '../api/client';
import PanelActivacion from '../components/panel/PanelActivacion';
import PanelDatosGenerales from '../components/panel/PanelDatosGenerales';
import PanelHabitaciones from '../components/panel/PanelHabitaciones';

export default function PanelHotel() {
  const {
    token, hotel, updateHotel, logout,
  } = useAuth();
  const navigate = useNavigate();

  const [estado, setEstado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargarEstado = useCallback(async () => {
    try {
      const data = await getMisDatos(token);
      setEstado(data);
      updateHotel(data.hotel);
      setError('');
    } catch (err) {
      setError(err.message || 'No se pudo cargar la informacion del hotel.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    cargarEstado();
  }, [cargarEstado]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="container panel-hotel">
      <div className="panel-hotel__header">
        <div>
          <h1>Panel de {hotel?.nombre || 'tu hotel'}</h1>
          <p className="panel-hotel__subtitle">Administra los datos de tu hotel y tus habitaciones.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={handleLogout}>
          Cerrar sesion
        </button>
      </div>

      {loading && <p>Cargando...</p>}
      {error && <p className="form-banner form-banner--error">{error}</p>}

      {estado && (
        <>
          <PanelActivacion estado={estado} token={token} onCambio={cargarEstado} />
          <PanelDatosGenerales hotel={estado.hotel} token={token} onGuardado={cargarEstado} />
          <PanelHabitaciones token={token} onCambio={cargarEstado} />
        </>
      )}
    </div>
  );
}
