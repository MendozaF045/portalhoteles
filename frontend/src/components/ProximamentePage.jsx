export default function ProximamentePage({ titulo, mensaje }) {
  return (
    <div className="container page-placeholder">
      <h1>{titulo}</h1>
      <p>{mensaje || 'Esta seccion todavia no esta disponible. Vuelve pronto.'}</p>
    </div>
  );
}
