import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginHotel } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { isValidEmail } from '../utils/validators';
import FormField from '../components/FormField';

const INITIAL_FORM = { email: '', password: '' };

export default function Login() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const errors = {};
    if (!form.email.trim()) {
      errors.email = 'El email es obligatorio';
    } else if (!isValidEmail(form.email)) {
      errors.email = 'El email no tiene un formato valido';
    }
    if (!form.password) {
      errors.password = 'La contrasena es obligatoria';
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
      const data = await loginHotel({ email: form.email.trim(), password: form.password });
      login(data);
      const redirectTo = location.state?.from?.pathname || '/panel-hotel';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setSubmitError(err.message || 'No se pudo iniciar sesion.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container form-page">
      <div className="form-card card">
        <h1>Inicia sesion</h1>
        <p className="form-page__intro">Accede al panel de tu hotel.</p>

        {submitError && <p className="form-banner form-banner--error">{submitError}</p>}

        <form onSubmit={handleSubmit} noValidate>
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
            id="password"
            label="Contrasena"
            type="password"
            required
            value={form.password}
            onChange={handleChange}
            error={fieldErrors.password}
          />

          <button type="submit" className="btn btn-primary form-page__submit" disabled={submitting}>
            {submitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="form-page__footer-link">
          <Link to="/recuperar-password">¿Olvidaste tu contrasena?</Link>
        </p>
        <p className="form-page__footer-link">
          ¿No tienes cuenta? <Link to="/registro">Registra tu hotel</Link>
        </p>
      </div>
    </div>
  );
}
