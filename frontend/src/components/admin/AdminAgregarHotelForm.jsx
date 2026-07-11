import { useState } from 'react';
import { agregarHotelAdmin } from '../../api/client';
import { isValidEmail } from '../../utils/validators';
import FormField from '../FormField';

const INITIAL_FORM = {
  nombre: '',
  pais: '',
  ciudad: '',
  descripcion: '',
  logoUrl: '',
  websiteUrl: '',
  whatsappNumero: '',
  precioReferencia: '',
  email: '',
  password: '',
};

export default function AdminAgregarHotelForm({ token, onCreado }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSuccessMessage('');
  };

  const validate = () => {
    const errors = {};
    if (!form.nombre.trim()) errors.nombre = 'El nombre es obligatorio';
    if (!form.pais.trim()) errors.pais = 'El pais es obligatorio';
    if (!form.ciudad.trim()) errors.ciudad = 'La ciudad es obligatoria';

    const tieneCredenciales = form.email.trim().length > 0 || form.password.length > 0;
    if (tieneCredenciales) {
      if (!isValidEmail(form.email)) {
        errors.email = 'El email no tiene un formato valido';
      }
      if (form.password.length < 6) {
        errors.password = 'La contrasena debe tener al menos 6 caracteres';
      }
    }

    if (form.precioReferencia && Number.isNaN(Number(form.precioReferencia))) {
      errors.precioReferencia = 'El precio debe ser un numero';
    }

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
      const datos = {
        nombre: form.nombre.trim(),
        pais: form.pais.trim(),
        ciudad: form.ciudad.trim(),
        descripcion: form.descripcion.trim() || undefined,
        logo_url: form.logoUrl.trim() || undefined,
        website_url: form.websiteUrl.trim() || undefined,
        whatsapp_numero: form.whatsappNumero.trim() || undefined,
        precio_referencia: form.precioReferencia ? Number(form.precioReferencia) : undefined,
      };
      if (form.email.trim() || form.password) {
        datos.email = form.email.trim();
        datos.password = form.password;
      }

      await agregarHotelAdmin(token, datos);
      setSuccessMessage('Hotel agregado correctamente.');
      setForm(INITIAL_FORM);
      await onCreado();
    } catch (err) {
      setSubmitError(err.message || 'No se pudo agregar el hotel.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="panel-section card">
      <h2>Agregar hotel manualmente</h2>

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
          <FormField id="pais" label="Pais" required value={form.pais} onChange={handleChange} error={fieldErrors.pais} />
          <FormField id="ciudad" label="Ciudad" required value={form.ciudad} onChange={handleChange} error={fieldErrors.ciudad} />
        </div>

        <FormField
          id="logoUrl"
          label="URL del logo (opcional)"
          type="url"
          placeholder="https://..."
          value={form.logoUrl}
          onChange={handleChange}
        />
        <FormField
          id="websiteUrl"
          label="Link a su pagina web (opcional)"
          type="url"
          placeholder="https://..."
          value={form.websiteUrl}
          onChange={handleChange}
        />

        <div className="form-row">
          <FormField
            id="whatsappNumero"
            label="WhatsApp (opcional)"
            placeholder="+51987654321"
            value={form.whatsappNumero}
            onChange={handleChange}
          />
          <FormField
            id="precioReferencia"
            label="Precio de referencia (opcional)"
            type="number"
            min="0"
            value={form.precioReferencia}
            onChange={handleChange}
            error={fieldErrors.precioReferencia}
          />
        </div>

        <FormField
          id="descripcion"
          label="Descripcion breve (opcional)"
          as="textarea"
          rows={3}
          value={form.descripcion}
          onChange={handleChange}
        />

        <p className="admin-form__seccion-titulo">Credenciales de acceso (opcional)</p>
        <div className="form-row">
          <FormField id="email" label="Email" type="email" value={form.email} onChange={handleChange} error={fieldErrors.email} />
          <FormField id="password" label="Contrasena" type="password" value={form.password} onChange={handleChange} error={fieldErrors.password} />
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Agregando...' : 'Agregar hotel'}
        </button>
      </form>
    </section>
  );
}
