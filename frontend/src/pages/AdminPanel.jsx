import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { getHotelesActivos, getHotelesInactivos, getBanners } from '../api/client';
import AdminHoteles from '../components/admin/AdminHoteles';
import AdminAgregarHotelForm from '../components/admin/AdminAgregarHotelForm';
import AdminBanner from '../components/admin/AdminBanner';

export default function AdminPanel() {
  const { token, admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  const [hotelesActivos, setHotelesActivos] = useState([]);
  const [hotelesInactivos, setHotelesInactivos] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargarHoteles = useCallback(async () => {
    const [activos, inactivos] = await Promise.all([
      getHotelesActivos(token),
      getHotelesInactivos(token),
    ]);
    setHotelesActivos(activos.hoteles);
    setHotelesInactivos(inactivos.hoteles);
  }, [token]);

  const cargarBanners = useCallback(async () => {
    const data = await getBanners(token);
    setBanners(data.banners);
  }, [token]);

  const cargarTodo = useCallback(async () => {
    try {
      await Promise.all([cargarHoteles(), cargarBanners()]);
      setError('');
    } catch (err) {
      setError(err.message || 'No se pudo cargar la informacion del panel.');
    } finally {
      setLoading(false);
    }
  }, [cargarHoteles, cargarBanners]);

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="container panel-hotel admin-panel">
      <div className="panel-hotel__header">
        <div>
          <span className="admin-badge">ADMIN</span>
          <h1>Panel Super Admin</h1>
          <p className="panel-hotel__subtitle">{admin?.email}</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={handleLogout}>
          Cerrar sesion
        </button>
      </div>

      {loading && <p>Cargando...</p>}
      {error && <p className="form-banner form-banner--error">{error}</p>}

      {!loading && (
        <>
          <AdminHoteles
            token={token}
            hotelesActivos={hotelesActivos}
            hotelesInactivos={hotelesInactivos}
            onCambio={cargarHoteles}
          />
          <AdminAgregarHotelForm token={token} onCreado={cargarHoteles} />
          <AdminBanner token={token} banners={banners} onCambio={cargarBanners} />
        </>
      )}
    </div>
  );
}
