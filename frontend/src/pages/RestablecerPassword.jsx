import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPasswordHotel } from '../api/client';
import FormField from '../components/FormField';

export default function RestablecerPassword() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const errors = {};
    if (!token.trim()) errors.token = 'El codigo de restablecimiento es obligatorio';
    if (!password) {
      errors.password = 'La contrasena es obligatoria';
    } else if (password.length < 6) {
      errors.password = 'La contrasena debe tener al menos 6 caracteres';
    }
    if (confirmPassword !== password) {
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
      await resetPasswordHotel({ token: token.trim(), password });
      setSuccess(true);
    } catch (err) {
      setSubmitError(err.message || 'No se pudo restablecer la contrasena.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="container form-page">
        <div className="form-card card">
          <h1>Contrasena actualizada</h1>
          <p>Ya puedes iniciar sesion con tu nueva contrasena.</p>
          <button type="button" className="btn btn-primary form-page__submit" onClick={() => navigate('/login')}>
            Ir a login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container form-page">
      <div className="form-card card">
        <h1>Restablecer contrasena</h1>
        <p className="form-page__intro">
          Pega el codigo que recibiste y elige una nueva contrasena.
        </p>

        {submitError && <p className="form-banner form-banner--error">{submitError}</p>}

        <form onSubmit={handleSubmit} noValidate>
          <FormField
            id="token"
            label="Codigo de restablecimiento"
            required
            value={token}
            onChange={(event) => setToken(event.target.value)}
            error={fieldErrors.token}
          />
          <FormField
            id="password"
            label="Nueva contrasena"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
          />
          <FormField
            id="confirmPassword"
            label="Confirmar contrasena"
            type="password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={fieldErrors.confirmPassword}
          />

          <button type="submit" className="btn btn-primary form-page__submit" disabled={submitting}>
            {submitting ? 'Guardando...' : 'Guardar nueva contrasena'}
          </button>
        </form>

        <p className="form-page__footer-link">
          <Link to="/login">Volver a login</Link>
        </p>
      </div>
    </div>
  );
}
