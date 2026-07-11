import { getCountryFlag } from '../utils/countryFlags';

export default function DestinoCard({ destino }) {
  return (
    <article className="destino-card card">
      <p className="destino-card__ubicacion">
        {getCountryFlag(destino.pais)} {destino.ciudad}, {destino.pais}
      </p>
      <h3 className="destino-card__titulo">{destino.titulo}</h3>
      <p className="destino-card__resumen">{destino.resumen}</p>
      <a href={destino.fuente_url} target="_blank" rel="noopener noreferrer" className="destino-card__fuente">
        Fuente{destino.fuente_nombre ? `: ${destino.fuente_nombre}` : ''} ↗
      </a>
    </article>
  );
}
