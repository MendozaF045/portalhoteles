import { NavLink } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/destinos', label: 'Destinos' },
  { to: '/contacto', label: 'Contacto' },
  { to: '/registro', label: 'Registro' },
  { to: '/login', label: 'Login' },
];

export default function Header() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <NavLink to="/" className="site-header__brand" end>
          PortalHoteles<span>.com</span>
        </NavLink>

        <nav className="site-header__nav" aria-label="Navegacion principal">
          {NAV_LINKS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `site-header__link${isActive ? ' is-active' : ''}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <ThemeToggle />
      </div>
    </header>
  );
}
