import { useState } from 'react';
import FormField from '../FormField';

const TIPOS_BANO = ['Privado', 'Compartido'];
const TAMANOS_CAMA = ['Individual', 'Doble', 'Queen', 'King'];

function initialState(habitacion) {
  return {
    descripcion: habitacion?.descripcion || '',
    tipoBano: habitacion?.tipo_bano || TIPOS_BANO[0],
    tamanoCama: habitacion?.tamano_cama || TAMANOS_CAMA[0],
    capacidadHuespedes: habitacion?.capacidad_huespedes ? String(habitacion.capacidad_huespedes) : '2',
  };
}

export default function HabitacionForm({
  habitacion, onSubmit, onCancel, submitLabel,
}) {
  const [form, setForm] = useState(() => initialState(habitacion));
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const errors = {};
    if (!form.descripcion.trim()) {
      errors.descripcion = 'La descripcion es obligatoria';
    }
    const capacidad = Number(form.capacidadHuespedes);
    if (!Number.isInteger(capacidad) || capacidad <= 0) {
      errors.capacidadHuespedes = 'La capacidad debe ser un numero entero mayor a 0';
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
      await onSubmit({
        descripcion: form.descripcion.trim(),
        tipo_bano: form.tipoBano,
        tamano_cama: form.tamanoCama,
        capacidad_huespedes: Number(form.capacidadHuespedes),
      });
    } catch (err) {
      setSubmitError(err.message || 'No se pudo guardar la habitacion.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="habitacion-form" onSubmit={handleSubmit} noValidate>
      {submitError && <p className="form-banner form-banner--error">{submitError}</p>}

      <FormField
        id="descripcion"
        label="Descripcion"
        as="textarea"
        rows={2}
        required
        value={form.descripcion}
        onChange={handleChange}
        error={fieldErrors.descripcion}
      />

      <div className="form-row">
        <FormField id="tipoBano" label="Tipo de bano" as="select" required value={form.tipoBano} onChange={handleChange}>
          {TIPOS_BANO.map((opcion) => (
            <option key={opcion} value={opcion}>{opcion}</option>
          ))}
        </FormField>

        <FormField id="tamanoCama" label="Tamano de cama" as="select" required value={form.tamanoCama} onChange={handleChange}>
          {TAMANOS_CAMA.map((opcion) => (
            <option key={opcion} value={opcion}>{opcion}</option>
          ))}
        </FormField>
      </div>

      <FormField
        id="capacidadHuespedes"
        label="Capacidad de huespedes"
        type="number"
        min="1"
        required
        value={form.capacidadHuespedes}
        onChange={handleChange}
        error={fieldErrors.capacidadHuespedes}
      />

      <div className="habitacion-form__acciones">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Guardando...' : submitLabel}
        </button>
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
