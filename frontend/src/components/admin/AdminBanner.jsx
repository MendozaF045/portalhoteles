import { useState } from 'react';
import {
  crearBanner, actualizarBanner, eliminarBanner, activarBanner, desactivarBanner,
} from '../../api/client';
import BannerForm from './BannerForm';

function BannerRow({
  banner, token, onCambio, editando, onEditar, onCancelarEdicion,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleActivo = async () => {
    setSubmitting(true);
    setError('');
    try {
      if (banner.activo) {
        await desactivarBanner(token, banner.id);
      } else {
        await activarBanner(token, banner.id);
      }
      await onCambio();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el banner.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEliminar = async () => {
    if (!window.confirm(`¿Eliminar el banner "${banner.titulo}"?`)) {
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await eliminarBanner(token, banner.id);
      await onCambio();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el banner.');
      setSubmitting(false);
    }
  };

  const handleActualizar = async (datos) => {
    await actualizarBanner(token, banner.id, datos);
    onCancelarEdicion();
    await onCambio();
  };

  if (editando) {
    return (
      <li className="panel-habitacion admin-banner-row admin-banner-row--editando">
        <BannerForm banner={banner} onSubmit={handleActualizar} onCancel={onCancelarEdicion} submitLabel="Guardar cambios" />
      </li>
    );
  }

  return (
    <li className="panel-habitacion">
      <div className="panel-habitacion__info">
        <p className="panel-habitacion__descripcion">
          {banner.titulo} {banner.activo && <span className="admin-badge">ACTIVO</span>}
        </p>
        <p className="panel-habitacion__detalle">
          {banner.imagenes.length} imagen{banner.imagenes.length === 1 ? '' : 'es'} · {banner.link}
        </p>
        {error && <p className="form-field__error">{error}</p>}
      </div>
      <div className="panel-habitacion__acciones">
        <button type="button" className="btn btn-outline" onClick={toggleActivo} disabled={submitting}>
          {banner.activo ? 'Desactivar' : 'Activar'}
        </button>
        <button type="button" className="btn btn-outline" onClick={onEditar} disabled={submitting}>
          Editar
        </button>
        <button type="button" className="btn btn-outline" onClick={handleEliminar} disabled={submitting}>
          Eliminar
        </button>
      </div>
    </li>
  );
}

export default function AdminBanner({ token, banners, onCambio }) {
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  const handleCrear = async (datos) => {
    await crearBanner(token, datos);
    setMostrarFormNuevo(false);
    await onCambio();
  };

  return (
    <section className="panel-section card">
      <div className="panel-section__header">
        <h2>Banner destacado</h2>
        {!mostrarFormNuevo && (
          <button type="button" className="btn btn-primary" onClick={() => setMostrarFormNuevo(true)}>
            Crear banner
          </button>
        )}
      </div>

      <p className="admin-banner__ayuda">
        Solo puede haber un banner activo a la vez; activar uno desactiva automaticamente cualquier otro.
      </p>

      {mostrarFormNuevo && (
        <BannerForm onSubmit={handleCrear} onCancel={() => setMostrarFormNuevo(false)} submitLabel="Crear banner" />
      )}

      {banners.length === 0 ? (
        <p className="panel-habitaciones__vacio">Todavia no hay banners creados.</p>
      ) : (
        <ul className="panel-habitaciones__lista">
          {banners.map((banner) => (
            <BannerRow
              key={banner.id}
              banner={banner}
              token={token}
              onCambio={onCambio}
              editando={editandoId === banner.id}
              onEditar={() => setEditandoId(banner.id)}
              onCancelarEdicion={() => setEditandoId(null)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
