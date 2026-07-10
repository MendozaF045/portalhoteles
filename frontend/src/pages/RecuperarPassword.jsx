import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordHotel } from '../api/client';
import { isValidEmail } from '../utils/validators';
import FormField from '../components/FormField';

export default function RecuperarPassword() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    setResult(null);

    if (!email.trim()) {
      setFieldError('El email es obligatorio');
      return;
    }
    if (!isValidEmail(email)) {
      setFieldError('El email no tiene un formato valido');
      return;
    }
    setFieldError('');

    setSubmitting(true);
    try {
      const data = await forgotPasswordHotel({ email: email.trim() });
      setResult(data);
    } catch (err) {
      setSubmitError(err.message || 'No se pudo procesar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container form-page">
      <div className="form-card card">
        <h1>Recuperar contrasena</h1>
        <p className="form-page__intro">
          Ingresa el email de tu cuenta y te indicaremos como continuar.
        </p>

        {submitError && <p className="form-banner form-banner--error">{submitError}</p>}

        {result ? (
          <div className="form-banner form-banner--success">
            <p>{result.message}</p>
            {result.resetToken && (
              <>
                <p className="form-banner__dev-note">{result.dev_note}</p>
                <Link
                  className="btn btn-outline"
                  to={`/restablecer-password?token=${encodeURIComponent(result.resetToken)}`}
                >
                  Continuar con el restablecimiento
                </Link>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <FormField
              id="email"
              label="Email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={fieldError}
            />

            <button type="submit" className="btn btn-primary form-page__submit" disabled={submitting}>
              {submitting ? 'Enviando...' : 'Enviar instrucciones'}
            </button>
          </form>
        )}

        <p className="form-page__footer-link">
          <Link to="/login">Volver a login</Link>
        </p>
      </div>
    </div>
  );
}
