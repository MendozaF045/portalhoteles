# API.md — PortalHoteles.com (Fases 2 a 5)

Documentación de los endpoints REST del backend, pensada para probarse con Postman (o cualquier cliente HTTP) sin pasar por la UI. Ver [SPEC.md](./SPEC.md) para las reglas de negocio completas.

## Base URL

```
http://localhost:3001/api
```

## Puesta en marcha rápida

```bash
cd backend
npm install
cp .env.example .env      # y ajusta JWT_SECRET / SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD
npm run db:init            # crea el archivo SQLite con el esquema
npm run seed:admin         # crea la cuenta de super admin a partir de las vars de entorno
npm run dev                # levanta el servidor en http://localhost:3001
```

## Autenticación

Todos los endpoints protegidos usan JWT enviado en el header:

```
Authorization: Bearer <token>
```

Hay dos "roles" de token, no intercambiables entre sí:

| Rol | Se obtiene en | Da acceso a |
|---|---|---|
| `hotel` | `POST /auth/hotel/login` o `/auth/hotel/registro` | `/hotel/*` |
| `super_admin` | `POST /auth/admin/login` | `/admin/*` |

Un token de hotel usado contra una ruta `/admin/*` (o viceversa) responde `403`. Una ruta protegida sin token, o con token inválido/expirado, responde `401`.

## Formato de errores

Todos los errores devuelven `{ "error": "mensaje" }` con el status code correspondiente:

| Código | Significado |
|---|---|
| 400 | Body/query inválido (campo faltante, tipo incorrecto, regla de negocio no cumplida) |
| 401 | Falta token, token inválido/expirado, o credenciales incorrectas |
| 403 | Token válido pero rol incorrecto para el recurso |
| 404 | Recurso no encontrado (o no pertenece al hotel autenticado) |
| 409 | Conflicto (email ya registrado) |

---

## 1. Auth de hotel — `/auth/hotel`

### `POST /auth/hotel/registro`

Crea la cuenta de usuario **y** el hotel en un solo paso.

Body:
```json
{
  "nombre": "Hotel Faraon",
  "pais": "Egipto",
  "ciudad": "Giza",
  "email": "faraon@example.com",
  "password": "secret123",
  "descripcion": "Un hotel junto a las piramides",
  "website_url": "https://hotelfaraon.example",
  "whatsapp_numero": "+201234567890",
  "logo_url": "https://.../logo.png",
  "precio_referencia": 120
}
```

Requeridos: `nombre`, `pais`, `ciudad`, `email` (formato válido), `password` (mínimo 6 caracteres). El resto es opcional.

Respuesta `201`:
```json
{
  "token": "<jwt>",
  "hotel": {
    "id": 1, "slug": "hotel-faraon", "nombre": "Hotel Faraon",
    "logo_url": null, "pais": "Egipto", "ciudad": "Giza",
    "descripcion": "...", "website_url": "...", "whatsapp_numero": "...",
    "precio_referencia": 120, "activo": false, "created_at": "..."
  }
}
```

El `slug` se genera automáticamente a partir de `nombre` (minúsculas, sin acentos, espacios → `-`) y es único; si colisiona se le agrega un sufijo `-2`, `-3`, etc.

Errores: `400` (campos faltantes/inválidos), `409` (email ya registrado).

### `POST /auth/hotel/login`

Body: `{ "email": "...", "password": "..." }`
Respuesta `200`: igual forma que el registro (`token` + `hotel`).
Errores: `400` (faltan campos), `401` (credenciales inválidas).

### `POST /auth/hotel/forgot-password`

Body: `{ "email": "..." }`

Siempre responde `200` con un mensaje genérico, exista o no el email (para no filtrar qué emails están registrados):
```json
{ "message": "Si el email existe, se enviaran instrucciones para restablecer la contrasena" }
```

**Nota de desarrollo**: como todavía no hay servicio de envío de correo, si el email sí existe la respuesta incluye además el token en crudo, solo para poder probar el flujo end-to-end desde Postman:
```json
{
  "message": "...",
  "dev_note": "No hay servicio de email configurado todavia; el token se devuelve aqui solo para pruebas.",
  "resetToken": "7e6614e0...",
  "resetTokenExpiresAt": "2026-07-10T20:36:54.784Z"
}
```
El token expira 1 hora después de generado. Esto deberá reemplazarse por un envío de correo real antes de producción.

### `POST /auth/hotel/reset-password`

Body: `{ "token": "<resetToken>", "password": "nuevaPassword123" }`
Respuesta `200`: `{ "message": "Contrasena actualizada correctamente" }`
Errores: `400` (token inválido, ya usado, o expirado; o password < 6 caracteres). El token se invalida después de usarse una vez.

---

## 2. Panel de hotel — `/hotel` (requiere token de rol `hotel`)

### `GET /hotel/me`

Devuelve el perfil del hotel autenticado junto con el estado de la regla de activación.

Respuesta `200`:
```json
{
  "hotel": { "...": "..." },
  "habitaciones_count": 3,
  "habitaciones_requeridas": 4,
  "puede_activarse": false
}
```

### `PUT /hotel/me`

Edita los datos generales del propio hotel (SPEC.md sección 7.1). Acepta cualquier subconjunto de los campos de abajo (solo actualiza lo enviado); enviar un campo como string vacío lo limpia (lo deja en `null`).

Body:
```json
{
  "nombre": "Hotel Faraon Deluxe",
  "pais": "Egipto",
  "ciudad": "Giza",
  "descripcion": "El mejor hotel de Giza",
  "website_url": "https://hotelfaraon.example",
  "logo_url": "https://.../logo.png"
}
```

Si se envían, `nombre`, `pais` y `ciudad` no pueden ser strings vacíos (`400` si lo son). **El `slug` nunca cambia**, aunque se edite `nombre` — es intencional, para no romper el link del perfil público (`/hotelfaraon`), el link del banner destacado, ni el link de reserva por WhatsApp, todos construidos con el slug original. No se puede editar `email`/`password` (usar el flujo de reset), ni `whatsapp_numero`/`precio_referencia` desde este endpoint (no hay UI para eso todavía), ni `activo` (usar `/hotel/activar` / `/hotel/desactivar`).

Respuesta `200`: `{ "hotel": { "...": "..." } }`. Errores: `400`.

### Habitaciones — `/hotel/habitaciones`

Todas las operaciones están limitadas a las habitaciones del hotel dueño del token; intentar editar/eliminar una habitación de otro hotel responde `404` (no se filtra su existencia).

**`GET /hotel/habitaciones`** — lista las habitaciones propias.
```json
{ "habitaciones": [ { "id": 1, "hotel_id": 1, "descripcion": "...", "tipo_bano": "...", "tamano_cama": "...", "capacidad_huespedes": 2, "precio": 80, "fotos": [], "created_at": "...", "updated_at": "..." } ] }
```

**`POST /hotel/habitaciones`** — crea una habitación.
Body:
```json
{
  "descripcion": "Habitacion doble con vista al mar",
  "tipo_bano": "privado",
  "tamano_cama": "queen",
  "capacidad_huespedes": 2,
  "precio": 80,
  "fotos": ["https://.../foto1.jpg"]
}
```
Requeridos: `descripcion`, `tipo_bano`, `tamano_cama` (strings no vacíos), `capacidad_huespedes` (entero positivo). Opcionales: `precio` (número ≥ 0), `fotos` (array de URLs). Respuesta `201` con la habitación creada.

**`PUT /hotel/habitaciones/:id`** — edita (acepta cualquier subconjunto de los campos de arriba, actualiza solo lo enviado). Respuesta `200` con la habitación actualizada.

**`DELETE /hotel/habitaciones/:id`** — elimina. Respuesta `204` sin body. **Efecto secundario**: si tras eliminarla el hotel queda con menos de 4 habitaciones y estaba `activo`, se desactiva automáticamente en la misma transacción (ver "Regla de visibilidad" más abajo). El body de la respuesta sigue sin incluir esa información — el frontend la ve al volver a pedir `GET /hotel/me`.

### Activación — regla de negocio (SPEC.md sección 3)

**`POST /hotel/activar`**

Requiere que el hotel tenga **mínimo 4 habitaciones** cargadas. Si no las tiene:

Respuesta `400`:
```json
{ "error": "Faltan 1 habitacion(es) para poder activarse (minimo 4)" }
```

Si cumple la condición, respuesta `200`: `{ "activo": true, "habitaciones_count": 4 }`. Este es el caso límite (boundary) explícito de la spec: probar con exactamente 3 y exactamente 4 habitaciones.

**`POST /hotel/desactivar`**

Siempre permitido, sin condición de habitaciones. Respuesta `200`: `{ "activo": false }`.

---

## 3. Público / Home — `/public` (sin autenticación)

### `GET /public/hoteles`

Lista los hoteles que cumplen la **regla de visibilidad completa** de SPEC.md sección 3 — `activo = 1` **Y** `>= 4` habitaciones cargadas, evaluadas ambas en cada request (el conteo de habitaciones se recalcula en vivo con una subquery, no se confía en que `activo` esté siempre sincronizado — ver "Regla de visibilidad" más abajo). Orden alfabético por `nombre` (case-insensitive). Filtros opcionales por querystring, combinables:

| Query param | Tipo | Ejemplo |
|---|---|---|
| `pais` | string (match exacto) | `?pais=Peru` |
| `ciudad` | string (match exacto) | `?ciudad=Cusco` |
| `precio_min` | number | `?precio_min=50` |
| `precio_max` | number | `?precio_max=150` |

Respuesta `200`:
```json
{
  "hoteles": [
    { "id": 2, "slug": "aurora-inn", "nombre": "Aurora Inn", "logo_url": null, "pais": "Peru", "ciudad": "Cusco", "precio_referencia": 60 },
    { "id": 1, "slug": "hotel-faraon", "nombre": "Hotel Faraon", "logo_url": null, "pais": "Egipto", "ciudad": "Giza", "precio_referencia": 120 }
  ]
}
```
`precio_min`/`precio_max` no numéricos responden `400`.

#### Regla de visibilidad (dos capas, independientes entre sí)

Un hotel con menos de 4 habitaciones nunca debería ser visible en el home, aunque quede `activo = 1` por algún camino no controlado. Esto se protege en dos capas:

1. **Auto-desactivación al eliminar una habitación** — `DELETE /hotel/habitaciones/:id` revisa el conteo después de borrar, dentro de la misma transacción: si queda por debajo de 4 y el hotel estaba activo, lo desactiva (`activo = 0`).
2. **Filtro por conteo en la propia query pública** — `GET /public/hoteles` nunca confía solo en el flag `activo`; siempre re-cuenta habitaciones con una subquery correlacionada (`>= 4`) en el mismo `WHERE`. Esta capa es independiente de la primera: aunque `activo` quedara en `1` por cualquier otra vía (un bug futuro, una edición manual en la base de datos, etc.), el hotel igual no aparecería en el listado público sin las 4 habitaciones.

Las dos capas comparten la misma constante `MIN_HABITACIONES` (definida una sola vez en `hotelEstado.controller.js` e importada donde hace falta), para que el mínimo nunca pueda quedar desincronizado entre `/hotel/activar`, la eliminación de habitaciones, y el listado público.

### `GET /public/destinos`

Lista el contenido de la pestaña Destinos (SPEC.md sección 4): resumen propio + backlink a la fuente, por país/ciudad. Filtros opcionales combinables por querystring: `pais`, `ciudad` (match exacto). Orden: país, luego ciudad, luego título (alfabético, case-insensitive).

Respuesta `200`:
```json
{
  "destinos": [
    {
      "id": 2, "pais": "Peru", "ciudad": "Cusco",
      "titulo": "Explora Cusco, Peru",
      "resumen": "...", "fuente_url": "https://...", "fuente_nombre": "...",
      "actualizado_at": "2026-07-10 21:41:55"
    }
  ]
}
```
No incluye `origen` ni `created_at` (son detalle de gestión interna, no del consumo público).

### `POST /public/hoteles/:slug/reservas`

Formulario de reserva del perfil público del hotel (SPEC.md sección 8). No requiere autenticación ni persiste nada en la base de datos: valida los datos y arma un link `wa.me` con el mensaje precargado, listo para que el navegador redirija a WhatsApp. No hay pasarela de pago (fuera de alcance).

Body:
```json
{
  "nombre": "Juan Perez",
  "habitacion_id": 1,
  "fecha_entrada": "2026-08-01",
  "fecha_salida": "2026-08-05",
  "huespedes": 2
}
```

Validaciones, en orden (la primera que falla corta la request con `400`, salvo las de "no encontrado" que son `404`):

| Campo | Regla | Error si falla |
|---|---|---|
| `:slug` en la URL | El hotel debe existir | `404 Hotel no encontrado` |
| `nombre` | String no vacío | `400` |
| `habitacion_id` | Entero positivo | `400` |
| `fecha_entrada`, `fecha_salida` | Formato `YYYY-MM-DD`, fecha de calendario real (rechaza p.ej. `2026-02-30`) | `400` |
| `huespedes` | Entero positivo | `400` |
| `fecha_entrada` | No puede ser una fecha pasada (se compara contra la fecha UTC del servidor) | `400 fecha_entrada no puede ser una fecha pasada` |
| `fecha_salida` | Debe ser **estrictamente posterior** a `fecha_entrada` (fechas iguales tambien fallan) | `400 fecha_salida debe ser posterior a fecha_entrada` |
| `habitacion_id` | Debe existir **y pertenecer a este hotel** (una habitación de otro hotel da `404`, no se filtra su existencia) | `404 Habitacion no encontrada en este hotel` |
| `huespedes` | No puede superar la `capacidad_huespedes` de la habitación — este es el caso límite explícito: probar con `huespedes` exactamente igual a la capacidad (debe pasar) y capacidad+1 (debe fallar) | `400 La habitacion admite un maximo de N huesped(es)` |
| hotel | Debe tener `whatsapp_numero` configurado | `400 Este hotel no tiene un numero de WhatsApp configurado` |

Respuesta `200`:
```json
{
  "whatsapp_url": "https://wa.me/201234567890?text=Hola%2C%20mi%20nombre...",
  "mensaje": "Hola, mi nombre es Juan Perez. Quiero reservar la habitacion \"Habitacion doble\" en Hotel Faraon del 2026-08-01 al 2026-08-05 para 2 huesped(es).",
  "hotel": { "id": 1, "slug": "hotel-faraon", "nombre": "Hotel Faraon" },
  "habitacion": { "id": 1, "descripcion": "Habitacion doble", "capacidad_huespedes": 2 }
}
```
`whatsapp_numero` se normaliza a solo dígitos (se aceptan `+`, espacios y guiones al cargarlo en el perfil del hotel) antes de armar la URL `wa.me`, como pide el formato de esa API.

### `GET /public/banner`

Banner destacado del home (SPEC.md sección 9.1). Devuelve el único banner con `activo = 1`, o `null` si el Super Admin no tiene ninguno activo en este momento (no es automático, lo decide el Super Admin).

Respuesta `200`:
```json
{
  "banner": {
    "id": 1,
    "titulo": "Hotel Faraon: descubre Giza",
    "descripcion": "Vive la experiencia junto a las piramides",
    "link": "/hotel-faraon",
    "imagenes": ["https://.../1.jpg", "https://.../2.jpg"]
  }
}
```
o `{ "banner": null }`. No incluye `activo` (siempre es implícitamente el activo) ni timestamps — son detalle de gestión interna.

---

## 4. Auth de super admin — `/auth/admin`

### `POST /auth/admin/login`

Body: `{ "email": "...", "password": "..." }`
Respuesta `200`: `{ "token": "<jwt>", "admin": { "id": 1, "email": "..." } }`
Errores: `400`, `401`.

No hay endpoint de registro público para super admin — la cuenta se crea/actualiza corriendo `npm run seed:admin` (lee `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` de `.env`) directamente en el servidor. Es intencional: acceso único y exclusivo (SPEC.md sección 9).

---

## 5. Panel super admin — `/admin` (requiere token de rol `super_admin`)

### `GET /admin/hoteles/activos`

Lista todos los hoteles con `activo = 1` (orden alfabético). Incluye todos los campos del hotel (a diferencia del listado público).

### `GET /admin/hoteles/inactivos`

Igual pero `activo = 0`.

### `POST /admin/hoteles`

Agrega un hotel manualmente, sin pasar por `/auth/hotel/registro`.

Body mínimo:
```json
{ "nombre": "Hotel Manual", "pais": "Chile", "ciudad": "Santiago" }
```
Opcionales: `descripcion`, `website_url`, `whatsapp_numero`, `logo_url`, `precio_referencia`, y opcionalmente `email` + `password` (ambos juntos) si además se quiere dejar credenciales de acceso listas para el hotel. Si se omiten `email`/`password`, el hotel queda sin cuenta de login asociada (se puede vincular más adelante — no hay endpoint para eso todavía).

El hotel creado siempre queda `activo: false`: la activación sigue siendo exclusiva del propio hotel vía `/hotel/activar` (el super admin no puede saltarse esa regla — ver SPEC.md sección 3 y 12, "Roles y permisos").

Respuesta `201` con el hotel creado. Errores: `400`, `409` (si el email ya existe).

### `DELETE /admin/hoteles/:id`

Elimina el hotel (sus habitaciones se eliminan en cascada) y, si tenía cuenta de login asociada, también la elimina. Respuesta `204`. `404` si el id no existe.

### Banner destacado — `/admin/banners` (SPEC.md sección 9.1)

Gestión del banner del home. **Solo puede haber un banner `activo` a la vez** — activar uno desactiva automáticamente cualquier otro (no hace falta desactivarlo a mano primero). No es automático: el Super Admin decide manualmente cuál mostrar, y también puede dejar el home sin ningún banner.

**`GET /admin/banners`** — lista todos los banners (activos o no), con sus imágenes y timestamps.

**`POST /admin/banners`** — crea un banner (queda `activo: false` hasta que se active explícitamente).
Body:
```json
{
  "titulo": "Hotel Faraon: descubre Giza",
  "descripcion": "Vive la experiencia junto a las piramides",
  "link": "/hotel-faraon",
  "imagenes": ["https://.../1.jpg", "https://.../2.jpg"]
}
```
Requeridos: `titulo`, `link` (strings no vacíos — `link` normalmente es la ruta al perfil público del hotel, ej. `/hotelfaraon`, pero acepta cualquier string no vacío), `imagenes` (array con al menos 1 URL `http(s)` válida). Opcional: `descripcion`. Respuesta `201`.

**`PUT /admin/banners/:id`** — edita (acepta cualquier subconjunto de los campos de arriba). Si se envía `imagenes`, **reemplaza toda la galería** (no hay endpoint para agregar/quitar una imagen individual). No cambia `activo` — para eso usar los endpoints de abajo. Respuesta `200`. Errores: `400`, `404`.

**`DELETE /admin/banners/:id`** — elimina el banner (sus imágenes se eliminan en cascada). Respuesta `204`. `404` si no existe.

**`POST /admin/banners/:id/activar`** — activa este banner y desactiva cualquier otro que estuviera activo, en una sola operación atómica. Respuesta `200` con el banner actualizado. `404` si no existe.

**`POST /admin/banners/:id/desactivar`** — desactiva este banner (el home queda sin banner destacado hasta que se active otro). Respuesta `200`. `404` si no existe.

### Destinos — `/admin/destinos` (SPEC.md sección 4)

Gestión del contenido de la pestaña Destinos. Cada entrada tiene un campo `origen`:

| `origen` | Cómo se genera | Se sobrescribe con el refresh (sección 6)? |
|---|---|---|
| `auto` | Generado por `POST /admin/destinos/refresh` (o el script `npm run destinos:refresh`) | Sí |
| `manual` | Creado con `POST` o cualquier entrada editada con `PUT` (el `PUT` siempre marca `origen: manual`, aunque haya empezado como `auto`) | No — queda protegida |

**`GET /admin/destinos`** — lista todas las entradas (activas o no en el público, cualquier `origen`). Filtros opcionales: `pais`, `ciudad`. Incluye todos los campos, incluyendo `origen` y `created_at`.

**`POST /admin/destinos`** — crea una entrada manual.
Body:
```json
{
  "pais": "Chile",
  "ciudad": "Santiago",
  "titulo": "Que hacer en Santiago",
  "resumen": "Resumen propio sobre Santiago, nunca copiado de otra pagina.",
  "fuente_url": "https://es.wikivoyage.org/wiki/Santiago_de_Chile",
  "fuente_nombre": "Wikivoyage"
}
```
Requeridos: `pais`, `ciudad`, `titulo`, `resumen` (strings no vacíos), `fuente_url` (URL `http(s)` válida — el backlink obligatorio a la fuente original). Opcional: `fuente_nombre`. Respuesta `201`. Errores: `400`, `409` (ya existe una entrada con el mismo `pais`+`ciudad`+`titulo`).

**`PUT /admin/destinos/:id`** — edita (acepta cualquier subconjunto de los campos de arriba). Siempre deja `origen: manual` al guardar, para que un refresh posterior no la pise. Respuesta `200`. Errores: `400`, `404`, `409` (si el cambio de `pais`/`ciudad`/`titulo` colisiona con otra entrada existente).

**`DELETE /admin/destinos/:id`** — elimina la entrada. Respuesta `204`. `404` si no existe.

---

## 6. Refresh de destinos (cache simulado) — SPEC.md sección 4

La spec pide "actualización periódica (cache, ej. semanal) desde fuentes externas confiables". Como todavía no hay una integración real con internet, este refresh está **simulado**: genera contenido placeholder por cada `pais`/`ciudad` donde haya al menos un hotel registrado (activo o no), y lo marca claramente como simulado (`fuente_nombre: "Fuente simulada (pendiente de integracion real)"`, `fuente_url` apunta a un dominio de ejemplo, no a una fuente real). Nunca sobrescribe entradas `manual`. Cuando se conecte una fuente real, solo hay que reemplazar `backend/src/services/destinosRefresh.js` (`buildSimulatedEntry`) — el resto (upsert, protección de entradas manuales, endpoint, script) no debería cambiar.

Dos formas equivalentes de dispararlo (comparten la misma lógica en `services/destinosRefresh.js`):

### `POST /admin/destinos/refresh`

Requiere token `super_admin`. Pensado para probarlo desde Postman o dispararlo desde un futuro botón de panel admin.

Respuesta `200`:
```json
{
  "message": "Refresco simulado ejecutado (no se conecto a ninguna fuente externa real todavia)",
  "paresProcesados": 2,
  "entradasActualizadas": 1
}
```
`paresProcesados` = cantidad de combinaciones país/ciudad distintas encontradas en `hoteles`. `entradasActualizadas` puede ser menor si alguna de esas entradas es `manual` (protegida) — en el ejemplo de arriba, de 2 pares solo se tocó 1 porque el otro ya estaba curado a mano.

### `npm run destinos:refresh`

Script de línea de comandos (`backend/src/db/refreshDestinos.js`) que corre la misma función directo contra la base de datos, sin pasar por HTTP ni requerir token. Pensado para eventualmente programarse en un cron job (ej. semanal, como pide la spec) el día que haya una fuente real conectada.

```bash
cd backend
npm run destinos:refresh
```

---

## 7. Contacto general de la plataforma — SPEC.md sección 5

Formulario de contacto general (no de un hotel específico).

### `POST /api/contacto`

Nota: esta es la única ruta que **no** cuelga de `/api/...` con un sub-prefijo de área (`/auth`, `/hotel`, `/public`, `/admin`) — vive directo en `/api/contacto`, tal como la pide la spec.

Body:
```json
{
  "nombre": "Maria Lopez",
  "email": "maria@example.com",
  "asunto": "Consulta general",
  "mensaje": "Hola, quisiera saber como listar mi hotel."
}
```
Requeridos: `nombre`, `email` (formato válido), `mensaje` (strings no vacíos). Opcional: `asunto`.

El mensaje se guarda en la tabla `contactos` (para poder verificarlo después vía `GET /admin/contactos`) y además se "envía" — hoy simulado con un `console.log` en el servidor, ya que no hay integración de correo real todavía.

Respuesta `201`:
```json
{
  "message": "Mensaje recibido correctamente",
  "dev_note": "No hay envio de correo real configurado todavia; el mensaje se guarda en la base de datos y se loggea en la consola del servidor.",
  "contacto_id": 1
}
```
Errores: `400` (campos faltantes o email inválido).

### `GET /admin/contactos`

Requiere token `super_admin`. Lista todos los mensajes de contacto recibidos, más recientes primero — pensado para verificar que el formulario efectivamente está guardando (no hay UI de admin todavía).

Respuesta `200`:
```json
{ "contactos": [ { "id": 1, "nombre": "Maria Lopez", "email": "maria@example.com", "asunto": "Consulta general", "mensaje": "...", "created_at": "..." } ] }
```

---

## Resumen de endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/auth/hotel/registro` | — | Registro de hotel + cuenta |
| POST | `/auth/hotel/login` | — | Login de hotel |
| POST | `/auth/hotel/forgot-password` | — | Solicitar reset de contraseña |
| POST | `/auth/hotel/reset-password` | — | Confirmar reset de contraseña |
| GET | `/hotel/me` | hotel | Perfil propio + estado de activación |
| PUT | `/hotel/me` | hotel | Editar datos generales propios |
| GET | `/hotel/habitaciones` | hotel | Listar habitaciones propias |
| POST | `/hotel/habitaciones` | hotel | Crear habitación |
| PUT | `/hotel/habitaciones/:id` | hotel | Editar habitación propia |
| DELETE | `/hotel/habitaciones/:id` | hotel | Eliminar habitación propia |
| POST | `/hotel/activar` | hotel | Activar (requiere ≥4 habitaciones) |
| POST | `/hotel/desactivar` | hotel | Desactivar |
| GET | `/public/hoteles` | — | Listado de hoteles activos con filtros |
| GET | `/public/destinos` | — | Listado de destinos con filtros |
| GET | `/public/banner` | — | Banner destacado activo (o null) |
| POST | `/public/hoteles/:slug/reservas` | — | Generar link de reserva a WhatsApp |
| POST | `/contacto` | — | Enviar mensaje de contacto general |
| POST | `/auth/admin/login` | — | Login de super admin |
| GET | `/admin/hoteles/activos` | super_admin | Listado completo de hoteles activos |
| GET | `/admin/hoteles/inactivos` | super_admin | Listado completo de hoteles inactivos |
| POST | `/admin/hoteles` | super_admin | Agregar hotel manualmente |
| DELETE | `/admin/hoteles/:id` | super_admin | Eliminar hotel |
| GET | `/admin/banners` | super_admin | Listar todos los banners |
| POST | `/admin/banners` | super_admin | Crear banner |
| PUT | `/admin/banners/:id` | super_admin | Editar banner (y/o reemplazar imágenes) |
| DELETE | `/admin/banners/:id` | super_admin | Eliminar banner |
| POST | `/admin/banners/:id/activar` | super_admin | Activar banner (desactiva cualquier otro) |
| POST | `/admin/banners/:id/desactivar` | super_admin | Desactivar banner |
| GET | `/admin/destinos` | super_admin | Listar todas las entradas de destinos |
| POST | `/admin/destinos` | super_admin | Crear entrada de destino manual |
| PUT | `/admin/destinos/:id` | super_admin | Editar entrada de destino |
| DELETE | `/admin/destinos/:id` | super_admin | Eliminar entrada de destino |
| POST | `/admin/destinos/refresh` | super_admin | Disparar el refresh simulado de cache |
| GET | `/admin/contactos` | super_admin | Listar mensajes de contacto recibidos |
| GET | `/health` | — | Chequeo de salud del servidor |

## Pendiente para próximas fases

- Subida de archivos (logo, fotos de habitaciones) — hoy `logo_url`/`fotos`/imágenes de banner son solo strings/URLs
- Envío real de correo para recuperación de contraseña y para el formulario de contacto
- Conectar `destinosRefresh.js` a una fuente externa real (hoy genera contenido simulado)
- Perfil público detallado por hotel (`/[slug]`) — el frontend ya tiene la ruta, pero la página es un placeholder
- Frontend: Destinos, Contacto, panel de super admin (hoy solo Home, Registro/Login/recuperación y el panel de hotel están construidos)

## Corregido: `activo` vs. cantidad de habitaciones (ver "Regla de visibilidad" en la sección 3)

Se detectó durante la Fase 7 que un hotel activo que eliminaba una habitación y quedaba por debajo de 4 seguía apareciendo en `GET /public/hoteles` — `activo` no se revertía, y el listado público solo filtraba por ese flag. Corregido con dos capas independientes: auto-desactivación al eliminar (`DELETE /hotel/habitaciones/:id`) + un filtro por conteo de habitaciones directamente en la query de `GET /public/hoteles`, que no depende de que `activo` esté sincronizado. Ver el detalle en la sección 3.
