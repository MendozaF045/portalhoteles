import { Link } from 'react-router-dom';

export default function HotelNoEncontrado() {
  return (
    <div className="container page-placeholder">
      <h1>Hotel no encontrado</h1>
      <p>Es posible que el link sea incorrecto o que este hotel ya no este disponible.</p>
      <Link to="/" className="btn btn-primary">Volver al home</Link>
    </div>
  );
}
