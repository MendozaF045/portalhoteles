import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Destinos from './pages/Destinos';
import Contacto from './pages/Contacto';
import Registro from './pages/Registro';
import Login from './pages/Login';
import HotelPerfil from './pages/HotelPerfil';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="destinos" element={<Destinos />} />
            <Route path="contacto" element={<Contacto />} />
            <Route path="registro" element={<Registro />} />
            <Route path="login" element={<Login />} />
            <Route path=":slug" element={<HotelPerfil />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
