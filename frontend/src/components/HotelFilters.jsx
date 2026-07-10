import { useMemo } from 'react';

const FILTROS_VACIOS = {
  pais: '', ciudad: '', precio_min: '', precio_max: '',
};

export default function HotelFilters({ hotelesTodos, filtros, onChange }) {
  const paises = useMemo(
    () => [...new Set(hotelesTodos.map((h) => h.pais))].sort((a, b) => a.localeCompare(b)),
    [hotelesTodos],
  );

  const ciudades = useMemo(() => {
    const fuente = filtros.pais
      ? hotelesTodos.filter((h) => h.pais === filtros.pais)
      : hotelesTodos;
    return [...new Set(fuente.map((h) => h.ciudad))].sort((a, b) => a.localeCompare(b));
  }, [hotelesTodos, filtros.pais]);

  const updateField = (field, value) => {
    const next = { ...filtros, [field]: value };
    if (field === 'pais' && !ciudades.includes(next.ciudad)) {
      next.ciudad = '';
    }
    onChange(next);
  };

  const hayFiltrosActivos = Object.values(filtros).some((value) => value !== '');

  return (
    <form className="hotel-filters" onSubmit={(event) => event.preventDefault()}>
      <div className="hotel-filters__field">
        <label htmlFor="filtro-pais">País</label>
        <select
          id="filtro-pais"
          value={filtros.pais}
          onChange={(event) => updateField('pais', event.target.value)}
        >
          <option value="">Todos</option>
          {paises.map((pais) => (
            <option key={pais} value={pais}>{pais}</option>
          ))}
        </select>
      </div>

      <div className="hotel-filters__field">
        <label htmlFor="filtro-ciudad">Ciudad</label>
        <select
          id="filtro-ciudad"
          value={filtros.ciudad}
          onChange={(event) => updateField('ciudad', event.target.value)}
        >
          <option value="">Todas</option>
          {ciudades.map((ciudad) => (
            <option key={ciudad} value={ciudad}>{ciudad}</option>
          ))}
        </select>
      </div>

      <div className="hotel-filters__field">
        <label htmlFor="filtro-precio-min">Precio min.</label>
        <input
          id="filtro-precio-min"
          type="number"
          min="0"
          placeholder="0"
          value={filtros.precio_min}
          onChange={(event) => updateField('precio_min', event.target.value)}
        />
      </div>

      <div className="hotel-filters__field">
        <label htmlFor="filtro-precio-max">Precio max.</label>
        <input
          id="filtro-precio-max"
          type="number"
          min="0"
          placeholder="Sin limite"
          value={filtros.precio_max}
          onChange={(event) => updateField('precio_max', event.target.value)}
        />
      </div>

      <button
        type="button"
        className="btn btn-outline hotel-filters__clear"
        onClick={() => onChange(FILTROS_VACIOS)}
        disabled={!hayFiltrosActivos}
      >
        Limpiar filtros
      </button>
    </form>
  );
}
