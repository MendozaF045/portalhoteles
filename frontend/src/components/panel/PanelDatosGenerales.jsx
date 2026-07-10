import { useEffect, useState } from 'react';
import { actualizarMisDatos } from '../../api/client';
import FormField from '../FormField';

function shapeForm(hotel) {
  return {
    nombre: hotel.nombre || '',
    pais: hotel.pais || '',
    ciudad: hotel.ciudad || '',
    descripcion: hotel.descripcion || '',
    websiteUrl: hotel.website_url || '',
    logoUrl: hotel.logo_url || '',
  };
}

export default function PanelDatosGenerales({ hotel, token, onGuardado }) {
  const [form, setForm] = useState(() => shapeForm(hotel));
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(shapeForm(hotel));
  }, [hotel]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSuccessMessage('');
  };

  const validate = () => {
    const errors = {};
    if (!form.nombre.trim()) errors.nombre = 'El nombre del hotel es obligatorio';
    if (!form.pais.trim()) errors.pais = 'El pais es obligatorio';
    if (!form.ciudad.trim()) errors.ciudad = 'La ciudad es obligatoria';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    setSuccessMessage('');
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      await actualizarMisDatos(token, {
        nombre: form.nombre.trim(),
        pais: form.pais.trim(),
        ciudad: form.ciudad.trim(),
        descripcion: form.descripcion.trim(),
        website_url: form.websiteUrl.trim(),
        logo_url: form.logoUrl.trim(),
      });
      setSuccessMessage('Datos actualizados correctamente.');
      await onGuardado();
    } catch (err) {
      setSubmitError(err.message || 'No se pudieron guardar los cambios.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="panel-section card">
      <h2>Datos generales</h2>

      {submitError && <p className="form-banner form-banner--error">{submitError}</p>}
      {successMessage && <p className="form-banner form-banner--success">{successMessage}</p>}

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          id="nombre"
          label="Nombre del hotel"
          required
          value={form.nombre}
          onChange={handleChange}
          error={fieldErrors.nombre}
        />

        <div className="form-row">
          <FormField
            id="pais"
            label="Pais"
            required
            value={form.pais}
            onChange={handleChange}
            error={fieldErrors.pais}
          />
          <FormField
            id="ciudad"
            label="Ciudad"
            required
            value={form.ciudad}
            onChange={handleChange}
            error={fieldErrors.ciudad}
          />
        </div>

        <FormField
          id="logoUrl"
          label="URL del logo"
          type="url"
          placeholder="https://..."
          value={form.logoUrl}
          onChange={handleChange}
        />

        <FormField
          id="websiteUrl"
          label="Link a tu pagina web"
          type="url"
          placeholder="https://..."
          value={form.websiteUrl}
          onChange={handleChange}
        />

        <FormField
          id="descripcion"
          label="Descripcion breve"
          as="textarea"
          rows={3}
          value={form.descripcion}
          onChange={handleChange}
        />

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </section>
  );
}
