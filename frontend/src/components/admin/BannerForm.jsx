import { useState } from 'react';
import FormField from '../FormField';

function initialState(banner) {
  return {
    titulo: banner?.titulo || '',
    descripcion: banner?.descripcion || '',
    link: banner?.link || '',
    imagenes: banner?.imagenes?.length ? [...banner.imagenes] : [''],
  };
}

export default function BannerForm({
  banner, onSubmit, onCancel, submitLabel,
}) {
  const [form, setForm] = useState(() => initialState(banner));
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImagenChange = (index, value) => {
    setForm((prev) => {
      const imagenes = [...prev.imagenes];
      imagenes[index] = value;
      return { ...prev, imagenes };
    });
  };

  const agregarImagen = () => {
    setForm((prev) => ({ ...prev, imagenes: [...prev.imagenes, ''] }));
  };

  const quitarImagen = (index) => {
    setForm((prev) => ({ ...prev, imagenes: prev.imagenes.filter((_, i) => i !== index) }));
  };

  const validate = () => {
    const errors = {};
    if (!form.titulo.trim()) errors.titulo = 'El titulo es obligatorio';
    if (!form.link.trim()) errors.link = 'El link es obligatorio';

    const imagenesLimpias = form.imagenes.map((url) => url.trim()).filter(Boolean);
    if (imagenesLimpias.length === 0) {
      errors.imagenes = 'Agrega al menos una imagen';
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
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        link: form.link.trim(),
        imagenes: form.imagenes.map((url) => url.trim()).filter(Boolean),
      });
    } catch (err) {
      setSubmitError(err.message || 'No se pudo guardar el banner.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="habitacion-form" onSubmit={handleSubmit} noValidate>
      {submitError && <p className="form-banner form-banner--error">{submitError}</p>}

      <FormField id="titulo" label="Titulo" required value={form.titulo} onChange={handleChange} error={fieldErrors.titulo} />
      <FormField
        id="link"
        label="Link (ej. /hotelfaraon)"
        required
        value={form.link}
        onChange={handleChange}
        error={fieldErrors.link}
      />
      <FormField
        id="descripcion"
        label="Descripcion (opcional)"
        as="textarea"
        rows={2}
        value={form.descripcion}
        onChange={handleChange}
      />

      <div className="form-field">
        <label htmlFor="banner-imagen-0">Imagenes del carrusel</label>
        {form.imagenes.map((url, index) => (
          <div key={index} className="banner-form__imagen-row">
            <input
              id={index === 0 ? 'banner-imagen-0' : undefined}
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(event) => handleImagenChange(index, event.target.value)}
            />
            {form.imagenes.length > 1 && (
              <button type="button" className="btn btn-outline" onClick={() => quitarImagen(index)}>
                Quitar
              </button>
            )}
          </div>
        ))}
        {fieldErrors.imagenes && <p className="form-field__error">{fieldErrors.imagenes}</p>}
        <button type="button" className="btn btn-outline banner-form__agregar-imagen" onClick={agregarImagen}>
          Agregar imagen
        </button>
      </div>

      <div className="habitacion-form__acciones">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Guardando...' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-outline" onClick={onCancel} disabled={submitting}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
