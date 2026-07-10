import { useState } from 'react';
import { activarHotel, desactivarHotel } from '../../api/client';

export default function PanelActivacion({ estado, token, onCambio }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    habitaciones_count: count,
    habitaciones_requeridas: requeridas,
    puede_activarse: puedeActivarse,
    hotel,
  } = estado;
  const { activo } = hotel;
  const porcentaje = Math.min(100, Math.round((count / requeridas) * 100));
  const faltan = requeridas - count;

  const handleClick = async () => {
    setError('');
    setSubmitting(true);
    try {
      if (activo) {
        await desactivarHotel(token);
      } else {
        await activarHotel(token);
      }
      await onCambio();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el estado.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="panel-section card">
      <h2>Estado de publicacion</h2>

      <div className="panel-activacion__progreso">
        <div className="panel-activacion__barra">
          <div className="panel-activacion__barra-fill" style={{ width: `${porcentaje}%` }} />
        </div>
        <p className="panel-activacion__texto">
          {count} de {requeridas} habitaciones cargadas
        </p>
      </div>

      {error && <p className="form-banner form-banner--error">{error}</p>}

      {!activo && !puedeActivarse && (
        <p className="panel-activacion__aviso">
          Faltan {faltan} habitacion{faltan === 1 ? '' : 'es'} para poder activarte.
        </p>
      )}

      <button
        type="button"
        className={`btn ${activo ? 'btn-outline' : 'btn-primary'}`}
        onClick={handleClick}
        disabled={submitting || (!activo && !puedeActivarse)}
      >
        {submitting ? 'Procesando...' : activo ? 'Desactivar' : 'Activar'}
      </button>

      <p className="panel-activacion__estado-actual">
        Estado actual: <strong>{activo ? 'Activo (visible en el home)' : 'Inactivo'}</strong>
      </p>
    </section>
  );
}
