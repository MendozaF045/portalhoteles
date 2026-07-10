import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="btn btn-outline theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      <span aria-hidden="true">{isDark ? '☀️' : '🌙'}</span>
      <span className="theme-toggle__label">{isDark ? 'Claro' : 'Oscuro'}</span>
    </button>
  );
}
