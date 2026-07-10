import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Home from './pages/Home';
import Destinos from './pages/Destinos';
import Contacto from './pages/Contacto';
import Registro from './pages/Registro';
import Login from './pages/Login';
import RecuperarPassword from './pages/RecuperarPassword';
import RestablecerPassword from './pages/RestablecerPassword';
import PanelHotel from './pages/PanelHotel';
import HotelPerfil from './pages/HotelPerfil';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="destinos" element={<Destinos />} />
              <Route path="contacto" element={<Contacto />} />
              <Route path="registro" element={<Registro />} />
              <Route path="login" element={<Login />} />
              <Route path="recuperar-password" element={<RecuperarPassword />} />
              <Route path="restablecer-password" element={<RestablecerPassword />} />
              <Route
                path="panel-hotel"
                element={(
                  <PrivateRoute>
                    <PanelHotel />
                  </PrivateRoute>
                )}
              />
              <Route path=":slug" element={<HotelPerfil />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
