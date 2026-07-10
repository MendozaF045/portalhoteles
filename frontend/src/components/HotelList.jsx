import HotelCard from './HotelCard';

export default function HotelList({ hoteles, loading, error }) {
  if (loading) {
    return <p className="hotel-list__status">Cargando hoteles...</p>;
  }

  if (error) {
    return <p className="hotel-list__status hotel-list__status--error">{error}</p>;
  }

  if (hoteles.length === 0) {
    return <p className="hotel-list__status">No se encontraron hoteles con esos filtros.</p>;
  }

  return (
    <div className="hotel-list">
      {hoteles.map((hotel) => (
        <HotelCard key={hotel.id} hotel={hotel} />
      ))}
    </div>
  );
}
