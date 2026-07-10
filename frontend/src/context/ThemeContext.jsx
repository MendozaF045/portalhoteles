import {
  createContext, useContext, useEffect, useMemo, useState,
} from 'react';

const ThemeContext = createContext(null);

// SPEC.md seccion 10: modo oscuro por defecto, con toggle a modo claro.
// El default es SIEMPRE 'dark' salvo que el usuario ya haya elegido 'light' antes
// (no se sigue la preferencia del sistema operativo).
function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'dark';
  }
  return localStorage.getItem('theme') === 'light' ? 'light' : 'dark';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider');
  }
  return context;
}
