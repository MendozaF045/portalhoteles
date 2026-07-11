import { useState } from 'react';
import { crearReserva } from '../../api/client';
import { todayStr } from '../../utils/dates';
import FormField from '../FormField';

const INITIAL_FORM = {
  nombre: '', habitacionId: '', fechaEntrada: '', fechaSalida: '', huespedes: '1',
};

export default function ReservaForm({ slug, habitaciones }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resultado, setResultado] = useState(null);

  const habitacionSeleccionada = habitaciones.find((hab) => hab.id === Number(form.habitacionId));

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const errors = {};
    const hoy = todayStr();

    if (!form.nombre.trim()) {
      errors.nombre = 'El nombre es obligatorio';
    }
    if (!form.habitacionId) {
      errors.habitacionId = 'Selecciona una habitacion';
    }

    if (!form.fechaEntrada) {
      errors.fechaEntrada = 'La fecha de entrada es obligatoria';
    } else if (form.fechaEntrada < hoy) {
      errors.fechaEntrada = 'La fecha de entrada no puede ser una fecha pasada';
    }

    if (!form.fechaSalida) {
      errors.fechaSalida = 'La fecha de salida es obligatoria';
    } else if (form.fechaEntrada && form.fechaSalida <= form.fechaEntrada) {
      errors.fechaSalida = 'La fecha de salida debe ser posterior a la fecha de entrada';
    }

    const huespedes = Number(form.huespedes);
    if (!form.huespedes || !Number.isInteger(huespedes) || huespedes <= 0) {
      errors.huespedes = 'Ingresa una cantidad valida de huespedes';
    } else if (habitacionSeleccionada && huespedes > habitacionSeleccionada.capacidad_huespedes) {
      errors.huespedes = `Esta habitacion admite un maximo de ${habitacionSeleccionada.capacidad_huespedes} huesped(es)`;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      const data = await crearReserva(slug, {
        nombre: form.nombre.trim(),
        habitacion_id: Number(form.habitacionId),
        fecha_entrada: form.fechaEntrada,
        fecha_salida: form.fechaSalida,
        huespedes: Number(form.huespedes),
      });
      setResultado(data);
      window.open(data.whatsapp_url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setSubmitError(err.message || 'No se pudo generar la reserva.');
    } finally {
      setSubmitting(false);
    }
  };

  if (resultado) {
    return (
      <div className="form-banner form-banner--success">
        <p>Tu mensaje de reserva esta listo. Si no se abrio WhatsApp automaticamente, usa el boton de abajo.</p>
        <a className="btn btn-primary" href={resultado.whatsapp_url} target="_blank" rel="noopener noreferrer">
          Abrir WhatsApp
        </a>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => { setResultado(null); setForm(INITIAL_FORM); }}
        >
          Hacer otra reserva
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {submitError && <p className="form-banner form-banner--error">{submitError}</p>}

      <FormField
        id="nombre"
        label="Tu nombre"
        required
        value={form.nombre}
        onChange={handleChange}
        error={fieldErrors.nombre}
      />

      <FormField
        id="habitacionId"
        label="Habitacion"
        as="select"
        required
        value={form.habitacionId}
        onChange={handleChange}
        error={fieldErrors.habitacionId}
      >
        <option value="">Selecciona una habitacion</option>
        {habitaciones.map((hab) => (
          <option key={hab.id} value={hab.id}>
            {hab.descripcion} (hasta {hab.capacidad_huespedes} huesped{hab.capacidad_huespedes === 1 ? '' : 'es'})
          </option>
        ))}
      </FormField>

      <div className="form-row">
        <FormField
          id="fechaEntrada"
          label="Fecha de entrada"
          type="date"
          required
          min={todayStr()}
          value={form.fechaEntrada}
          onChange={handleChange}
          error={fieldErrors.fechaEntrada}
        />
        <FormField
          id="fechaSalida"
          label="Fecha de salida"
          type="date"
          required
          min={form.fechaEntrada || todayStr()}
          value={form.fechaSalida}
          onChange={handleChange}
          error={fieldErrors.fechaSalida}
        />
      </div>

      <FormField
        id="huespedes"
        label="Cantidad de huespedes"
        type="number"
        min="1"
        max={habitacionSeleccionada?.capacidad_huespedes || undefined}
        required
        value={form.huespedes}
        onChange={handleChange}
        error={fieldErrors.huespedes}
      />

      <button type="submit" className="btn btn-primary form-page__submit" disabled={submitting}>
        {submitting ? 'Generando reserva...' : 'Reservar por WhatsApp'}
      </button>
    </form>
  );
}
