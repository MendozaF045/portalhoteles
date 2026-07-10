import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBannerActivo } from '../api/client';

const AUTO_ADVANCE_MS = 5000;

export default function BannerCarousel() {
  const [banner, setBanner] = useState(null);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    getBannerActivo()
      .then((data) => {
        if (!cancelled) {
          setBanner(data.banner);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBanner(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const imagenes = banner?.imagenes || [];

  useEffect(() => {
    if (imagenes.length <= 1) {
      return undefined;
    }

    timerRef.current = setInterval(() => {
      setIndex((current) => (current + 1) % imagenes.length);
    }, AUTO_ADVANCE_MS);

    return () => clearInterval(timerRef.current);
  }, [imagenes.length]);

  if (!loaded || !banner || imagenes.length === 0) {
    return null;
  }

  const goTo = (nextIndex) => {
    setIndex((nextIndex + imagenes.length) % imagenes.length);
  };

  const isExternal = /^https?:\/\//.test(banner.link);

  const content = (
    <>
      <img src={imagenes[index]} alt={banner.titulo} className="banner-carousel__image" />
      <div className="banner-carousel__overlay">
        <h2>{banner.titulo}</h2>
        {banner.descripcion && <p>{banner.descripcion}</p>}
      </div>
    </>
  );

  return (
    <section className="banner-carousel" aria-label="Hotel destacado">
      <div className="banner-carousel__frame">
        {isExternal ? (
          <a href={banner.link} target="_blank" rel="noopener noreferrer" className="banner-carousel__link">
            {content}
          </a>
        ) : (
          <Link to={banner.link} className="banner-carousel__link">
            {content}
          </Link>
        )}

        {imagenes.length > 1 && (
          <>
            <button
              type="button"
              className="banner-carousel__nav banner-carousel__nav--prev"
              aria-label="Imagen anterior"
              onClick={() => goTo(index - 1)}
            >
              ‹
            </button>
            <button
              type="button"
              className="banner-carousel__nav banner-carousel__nav--next"
              aria-label="Imagen siguiente"
              onClick={() => goTo(index + 1)}
            >
              ›
            </button>

            <div className="banner-carousel__dots">
              {imagenes.map((url, dotIndex) => (
                <button
                  key={url}
                  type="button"
                  className={`banner-carousel__dot${dotIndex === index ? ' is-active' : ''}`}
                  aria-label={`Ir a la imagen ${dotIndex + 1}`}
                  onClick={() => goTo(dotIndex)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
