import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PanelHotel() {
  const { hotel, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="container page-placeholder">
      <h1>Panel de {hotel?.nombre || 'tu hotel'}</h1>
      <p>El panel de administracion de tu hotel (datos, habitaciones, activacion) estara disponible muy pronto.</p>
      <button type="button" className="btn btn-outline" onClick={handleLogout}>
        Cerrar sesion
      </button>
    </div>
  );
}
