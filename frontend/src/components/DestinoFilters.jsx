import { useMemo } from 'react';

const FILTROS_VACIOS = { pais: '', ciudad: '' };

export default function DestinoFilters({ destinosTodos, filtros, onChange }) {
  const paises = useMemo(
    () => [...new Set(destinosTodos.map((d) => d.pais))].sort((a, b) => a.localeCompare(b)),
    [destinosTodos],
  );

  const ciudades = useMemo(() => {
    const fuente = filtros.pais
      ? destinosTodos.filter((d) => d.pais === filtros.pais)
      : destinosTodos;
    return [...new Set(fuente.map((d) => d.ciudad))].sort((a, b) => a.localeCompare(b));
  }, [destinosTodos, filtros.pais]);

  const updateField = (field, value) => {
    const next = { ...filtros, [field]: value };
    if (field === 'pais' && !ciudades.includes(next.ciudad)) {
      next.ciudad = '';
    }
    onChange(next);
  };

  const hayFiltrosActivos = filtros.pais !== '' || filtros.ciudad !== '';

  return (
    <form className="hotel-filters" onSubmit={(event) => event.preventDefault()}>
      <div className="hotel-filters__field">
        <label htmlFor="destino-filtro-pais">País</label>
        <select
          id="destino-filtro-pais"
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
        <label htmlFor="destino-filtro-ciudad">Ciudad</label>
        <select
          id="destino-filtro-ciudad"
          value={filtros.ciudad}
          onChange={(event) => updateField('ciudad', event.target.value)}
        >
          <option value="">Todas</option>
          {ciudades.map((ciudad) => (
            <option key={ciudad} value={ciudad}>{ciudad}</option>
          ))}
        </select>
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
