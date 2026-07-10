import { useEffect, useState } from 'react';
import {
  getMisHabitaciones, crearHabitacion, actualizarHabitacion, eliminarHabitacion,
} from '../../api/client';
import HabitacionForm from './HabitacionForm';

export default function PanelHabitaciones({ token, onCambio }) {
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormNueva, setMostrarFormNueva] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await getMisHabitaciones(token);
      setHabitaciones(data.habitaciones);
      setError('');
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las habitaciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [token]);

  const handleCrear = async (datos) => {
    await crearHabitacion(token, datos);
    setMostrarFormNueva(false);
    await cargar();
    await onCambio();
  };

  const handleActualizar = async (id, datos) => {
    await actualizarHabitacion(token, id, datos);
    setEditandoId(null);
    await cargar();
    await onCambio();
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta habitacion?')) {
      return;
    }
    setEliminandoId(id);
    try {
      await eliminarHabitacion(token, id);
      await cargar();
      await onCambio();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la habitacion.');
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <section className="panel-section card">
      <div className="panel-section__header">
        <h2>Habitaciones</h2>
        {!mostrarFormNueva && (
          <button type="button" className="btn btn-primary" onClick={() => setMostrarFormNueva(true)}>
            Agregar habitacion
          </button>
        )}
      </div>

      {error && <p className="form-banner form-banner--error">{error}</p>}

      {mostrarFormNueva && (
        <HabitacionForm
          onSubmit={handleCrear}
          onCancel={() => setMostrarFormNueva(false)}
          submitLabel="Crear habitacion"
        />
      )}

      {loading ? (
        <p>Cargando habitaciones...</p>
      ) : habitaciones.length === 0 ? (
        <p className="panel-habitaciones__vacio">Todavia no cargaste ninguna habitacion.</p>
      ) : (
        <ul className="panel-habitaciones__lista">
          {habitaciones.map((hab) => (
            <li key={hab.id} className="panel-habitacion">
              {editandoId === hab.id ? (
                <HabitacionForm
                  habitacion={hab}
                  onSubmit={(datos) => handleActualizar(hab.id, datos)}
                  onCancel={() => setEditandoId(null)}
                  submitLabel="Guardar cambios"
                />
              ) : (
                <>
                  <div className="panel-habitacion__info">
                    <p className="panel-habitacion__descripcion">{hab.descripcion}</p>
                    <p className="panel-habitacion__detalle">
                      Bano {hab.tipo_bano} · Cama {hab.tamano_cama} · Hasta {hab.capacidad_huespedes}
                      {' '}
                      huesped{hab.capacidad_huespedes === 1 ? '' : 'es'}
                    </p>
                  </div>
                  <div className="panel-habitacion__acciones">
                    <button type="button" className="btn btn-outline" onClick={() => setEditandoId(hab.id)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => handleEliminar(hab.id)}
                      disabled={eliminandoId === hab.id}
                    >
                      {eliminandoId === hab.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
