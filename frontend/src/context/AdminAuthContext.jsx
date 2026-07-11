import {
  createContext, useContext, useMemo, useState,
} from 'react';

// Sesion completamente separada de AuthContext (hotel): storage key distinto,
// contexto distinto. Un token de hotel nunca debe dar acceso al panel admin
// ni viceversa — el backend ya lo exige (roles no intercambiables), esto lo
// refleja en el frontend.
const AdminAuthContext = createContext(null);
const STORAGE_KEY = 'portalhoteles_admin_auth';

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AdminAuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);

  const value = useMemo(() => ({
    token: auth?.token || null,
    admin: auth?.admin || null,
    isAuthenticated: !!auth?.token,
    login: (data) => {
      setAuth(data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },
    logout: () => {
      setAuth(null);
      localStorage.removeItem(STORAGE_KEY);
    },
  }), [auth]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth debe usarse dentro de un AdminAuthProvider');
  }
  return context;
}
