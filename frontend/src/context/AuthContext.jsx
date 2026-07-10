import {
  createContext, useContext, useMemo, useState,
} from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'portalhoteles_hotel_auth';

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);

  const value = useMemo(() => ({
    token: auth?.token || null,
    hotel: auth?.hotel || null,
    isAuthenticated: !!auth?.token,
    login: (data) => {
      setAuth(data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },
    updateHotel: (hotelData) => {
      setAuth((current) => {
        if (!current) {
          return current;
        }
        const next = { ...current, hotel: hotelData };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    logout: () => {
      setAuth(null);
      localStorage.removeItem(STORAGE_KEY);
    },
  }), [auth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
