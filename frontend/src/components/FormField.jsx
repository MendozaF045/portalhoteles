export default function FormField({
  id, label, as = 'input', type = 'text', error, required, ...rest
}) {
  const Component = as;
  const fieldProps = { id, name: id, ...rest };
  if (as === 'input') {
    fieldProps.type = type;
  }

  return (
    <div className="form-field">
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <Component {...fieldProps} aria-invalid={!!error} />
      {error && <p className="form-field__error" role="alert">{error}</p>}
    </div>
  );
}
