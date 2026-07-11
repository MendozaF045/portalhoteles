import { useState } from 'react';
import { enviarContacto } from '../api/client';
import { isValidEmail } from '../utils/validators';
import FormField from '../components/FormField';

const INITIAL_FORM = { nombre: '', email: '', mensaje: '' };

export default function Contacto() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const errors = {};
    if (!form.nombre.trim()) {
      errors.nombre = 'El nombre es obligatorio';
    }
    if (!form.email.trim()) {
      errors.email = 'El email es obligatorio';
    } else if (!isValidEmail(form.email)) {
      errors.email = 'El email no tiene un formato valido';
    }
    if (!form.mensaje.trim()) {
      errors.mensaje = 'El mensaje es obligatorio';
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
      await enviarContacto({
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        mensaje: form.mensaje.trim(),
      });
      setEnviado(true);
    } catch (err) {
      setSubmitError(err.message || 'No se pudo enviar el mensaje.');
    } finally {
      setSubmitting(false);
    }
  };

  if (enviado) {
    return (
      <div className="container form-page">
        <div className="form-card card">
          <h1>Mensaje enviado</h1>
          <p className="form-banner form-banner--success">
            Gracias por escribirnos. Te responderemos a la brevedad.
          </p>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => { setEnviado(false); setForm(INITIAL_FORM); }}
          >
            Enviar otro mensaje
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container form-page">
      <div className="form-card card">
        <h1>Contacto</h1>
        <p className="form-page__intro">
          ¿Tienes una pregunta o quieres listar tu hotel? Escribenos.
        </p>

        {submitError && <p className="form-banner form-banner--error">{submitError}</p>}

        <form onSubmit={handleSubmit} noValidate>
          <FormField
            id="nombre"
            label="Nombre"
            required
            value={form.nombre}
            onChange={handleChange}
            error={fieldErrors.nombre}
          />
          <FormField
            id="email"
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            error={fieldErrors.email}
          />
          <FormField
            id="mensaje"
            label="Mensaje"
            as="textarea"
            rows={5}
            required
            value={form.mensaje}
            onChange={handleChange}
            error={fieldErrors.mensaje}
          />

          <button type="submit" className="btn btn-primary form-page__submit" disabled={submitting}>
            {submitting ? 'Enviando...' : 'Enviar mensaje'}
          </button>
        </form>
      </div>
    </div>
  );
}
