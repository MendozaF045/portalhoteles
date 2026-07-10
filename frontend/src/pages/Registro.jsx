import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registrarHotel } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { isValidEmail } from '../utils/validators';
import FormField from '../components/FormField';

const INITIAL_FORM = {
  nombre: '', pais: '', ciudad: '', email: '', password: '', confirmPassword: '', logoUrl: '', descripcion: '',
};

export default function Registro() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const errors = {};
    if (!form.nombre.trim()) errors.nombre = 'El nombre del hotel es obligatorio';
    if (!form.pais.trim()) errors.pais = 'El pais es obligatorio';
    if (!form.ciudad.trim()) errors.ciudad = 'La ciudad es obligatoria';

    if (!form.email.trim()) {
      errors.email = 'El email es obligatorio';
    } else if (!isValidEmail(form.email)) {
      errors.email = 'El email no tiene un formato valido';
    }

    if (!form.password) {
      errors.password = 'La contrasena es obligatoria';
    } else if (form.password.length < 6) {
      errors.password = 'La contrasena debe tener al menos 6 caracteres';
    }

    if (form.confirmPassword !== form.password) {
      errors.confirmPassword = 'Las contrasenas no coinciden';
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
      const data = await registrarHotel({
        nombre: form.nombre.trim(),
        pais: form.pais.trim(),
        ciudad: form.ciudad.trim(),
        email: form.email.trim(),
        password: form.password,
        descripcion: form.descripcion.trim() || undefined,
        logo_url: form.logoUrl.trim() || undefined,
      });
      login(data);
      navigate('/panel-hotel', { replace: true });
    } catch (err) {
      setSubmitError(err.message || 'No se pudo completar el registro.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container form-page">
      <div className="form-card card">
        <h1>Registra tu hotel</h1>
        <p className="form-page__intro">
          Crea tu cuenta para cargar tus habitaciones y aparecer en PortalHoteles.com.
        </p>

        {submitError && <p className="form-banner form-banner--error">{submitError}</p>}

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
            id="email"
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            error={fieldErrors.email}
          />

          <div className="form-row">
            <FormField
              id="password"
              label="Contrasena"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              error={fieldErrors.password}
            />
            <FormField
              id="confirmPassword"
              label="Confirmar contrasena"
              type="password"
              required
              value={form.confirmPassword}
              onChange={handleChange}
              error={fieldErrors.confirmPassword}
            />
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
            id="descripcion"
            label="Descripcion breve (opcional)"
            as="textarea"
            rows={3}
            value={form.descripcion}
            onChange={handleChange}
          />

          <button type="submit" className="btn btn-primary form-page__submit" disabled={submitting}>
            {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="form-page__footer-link">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesion</Link>
        </p>
      </div>
    </div>
  );
}
