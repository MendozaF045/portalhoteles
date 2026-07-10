# SPEC.md — PortalHoteles.com

> Documento de referencia del proyecto. Léelo antes de generar código. Cualquier cambio de alcance debe reflejarse aquí primero.

## 1. Descripción general

PortalHoteles.com es una plataforma tipo directorio/marketplace de hoteles. Los hoteles se registran, cargan su información y habitaciones, y quedan visibles en un listado público con filtros. Cada hotel tiene su propia página de perfil público. Existe un panel de super administrador (dueño de la plataforma) y un panel por hotel (usuario registrado).

Proyecto secundario: servir como caso de práctica de QA/testing (funcional, negativo, límites, API, roles, automatización UI).

---

## 2. Roles de usuario

| Rol | Descripción |
|---|---|
| **Visitante** | Navega el home, ve hoteles, destinos, contacto. No requiere login. |
| **Hotel (usuario registrado)** | Administra su propio perfil, habitaciones, y activa/desactiva su visibilidad. |
| **Super Admin (dueño de la plataforma)** | Único con acceso total: ve todos los hoteles activos/inactivos, agrega o elimina hoteles manualmente. |

---

## 3. Home público (`/`)

- **Banner destacado**: hotel del mes, con carrusel de imágenes (gestionado manualmente por el Super Admin, ver sección 9.1).
- **Listado de hoteles**: orden alfabético, cada tarjeta muestra:
  - Logo del hotel (imagen destacada)
  - Nombre
  - Bandera del país (esquina de la tarjeta)
  - Ciudad / país
  - Precio de referencia
- **Filtros** (junto al listado):
  - País
  - Ciudad
  - Rango de precio
- **Menú superior**: Home | Destinos | Contacto | Registro | Login

### Regla de negocio: visibilidad de hoteles
- Un hotel aparece en el home **solo si**:
  1. Tiene mínimo **4 habitaciones cargadas**, Y
  2. El propio hotel presionó el botón **"Activar"** en su panel (el botón solo se habilita si se cumple el mínimo de habitaciones).
- Si el hotel tiene menos de 4 habitaciones, el botón "Activar" aparece deshabilitado con un mensaje indicando cuántas habitaciones le faltan.

---

## 4. Pestaña Destinos (`/destinos`)

- Contenido por país / ciudad donde hay hoteles registrados:
  - Lugares para visitar
  - Información general de planes locales
- **Fuente de datos**: actualización periódica (cache, ej. semanal) desde fuentes externas confiables.
- **Regla de derechos de autor**: nunca copiar texto textual de otras páginas. Todo contenido debe ser un resumen propio + enlace ("backlink") a la fuente original.

---

## 5. Contacto (`/contacto`)

- Formulario de contacto general de la plataforma (no de un hotel específico).

---

## 6. Registro / Login (hoteles)

- **Registro**: datos generales del hotel + credenciales de acceso.
- **Login**.
- **Recuperación de contraseña**: flujo estándar (correo con link de reseteo).

---

## 7. Panel del Hotel (usuario registrado)

Al ingresar por primera vez, el hotel debe completar:

### 7.1 Datos generales del hotel
- Logo (se reutiliza como imagen destacada en el home)
- Ubicación: país + ciudad (alimentan los filtros del home)
- Nombre del hotel
- Cantidad de habitaciones (calculado o declarado)
- Descripción breve
- Link a su página web propia (visible en su perfil público)

### 7.2 Habitaciones (una o más, mínimo 4 para poder activarse)
Por cada habitación:
- Descripción
- Tipo de baño
- Tamaño de cama
- Capacidad de huéspedes
- (Otros atributos que se definan: precio, fotos, etc.)

### 7.3 Estado
- Botón **Activar / Desactivar** (con la regla del punto 3).

---

## 8. Perfil público del hotel (`/[nombre-del-hotel]`)

Ejemplo: `portalhoteles.com/hotelfaraon`

Muestra:
- Logo, nombre, descripción, país/ciudad
- Link a la página web propia del hotel
- Listado de habitaciones disponibles (con toda su info)
- **Formulario de reserva** → al enviarse, redirige a **WhatsApp** del hotel con los datos precargados en el mensaje

> Nota técnica: se usa ruta simple (`/hotelfaraon`), no subdominio real (`hotelfaraon.portalhoteles.com`), para evitar configuración de DNS/hosting adicional. Mismo resultado visual para el usuario final.

---

## 9. Panel Super Admin (`/admin`, acceso único y exclusivo)

- Listado de hoteles **activos**
- Listado de hoteles **inactivos**
- **Agregar hotel manualmente** (sin pasar por el registro público)
- **Eliminar hotel**

### 9.1 Gestión del banner / hotel destacado del mes

El Super Admin es el único que puede definir qué hotel aparece en el banner destacado del home. No es automático ni lo elige el hotel. Desde el panel se debe poder cargar:

- **Galería de imágenes** para el carrusel del banner
- **Link** (destino al hacer clic: normalmente el perfil público del hotel, ej. `/hotelfaraon`)
- **Título** del banner (texto centrado)
- **Descripción** breve del banner

Solo puede haber un hotel destacado activo en el banner a la vez (el Super Admin decide cuándo cambiarlo).

---

## 10. Diseño / UI

| Aspecto | Definición |
|---|---|
| Estilo general | Clásico, sencillo, sin fondos neón |
| Modo | Oscuro por defecto + toggle a modo claro |
| Tipografías | Montserrat + League Spartan |
| Paleta de colores | Máximo 3 colores, tonos amigables a la vista |
| Bordes de botones | Radio 10–15px |
| Responsive | Adaptable a celular, tablet y PC |
| Footer | Créditos "FM WEB LAB" + link a su página |

---

## 11. Stack técnico propuesto

- **Backend**: Node.js + Express
- **Base de datos**: SQLite (simple, portable, ideal para desarrollo/testing)
- **Frontend**: React
- **Autenticación**: JWT o sesiones (a definir en desarrollo)
- **Imágenes**: almacenamiento local en desarrollo (carpeta `/uploads`), migrable a cloud storage después

---

## 12. Ganchos para práctica de QA (a propósito, no romper sin avisar)

| Técnica | Dónde se practica |
|---|---|
| Funcional / manual | Flujo completo: registro → carga de habitaciones → activación → reserva |
| Negativo | Formularios con campos vacíos, país sin bandera válida, email mal formado |
| Límites (boundary) | Exactamente 3 vs. 4 habitaciones (botón activar), fechas de reserva límite |
| Roles y permisos | Un hotel no debe poder ver el panel de otro hotel ni el panel super admin |
| API | Endpoints REST documentados, probables con Postman, sin pasar por la UI |
| UI automatizable | IDs y estructura HTML consistente para Playwright/Selenium/Cypress |
| Bugs sembrados | Se documentarán aparte en `BUGS.md` uno o dos bugs intencionales para que el QA los encuentre |

---

## 13. Fuera de alcance (por ahora)

- Pagos reales (solo reserva vía WhatsApp, no hay pasarela de pago)
- Subdominios reales por hotel
- Multilenguaje
- Búsqueda con datos de destinos 100% en tiempo real (se usa cache periódico)
