import { useParams } from 'react-router-dom';
import ProximamentePage from '../components/ProximamentePage';

export default function HotelPerfil() {
  const { slug } = useParams();
  return (
    <ProximamentePage
      titulo="Perfil de hotel"
      mensaje={`El perfil publico de "${slug}" estara disponible muy pronto.`}
    />
  );
}
