const FM_WEB_LAB_URL = import.meta.env.VITE_FM_WEB_LAB_URL || '#';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <p>© {year} PortalHoteles.com</p>
        <p>
          Creado por{' '}
          <a href={FM_WEB_LAB_URL} target="_blank" rel="noopener noreferrer">
            FM WEB LAB
          </a>
        </p>
      </div>
    </footer>
  );
}
