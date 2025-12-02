# Fitness-Marketplace

![CI](https://github.com/jneyral-oss/Fitness-Marketplace/actions/workflows/ci.yml/badge.svg)

Pequeña API demo para los endpoints solicitados: inicio de sesión, listado y detalle de planes, y registro de entrenamientos completados.

Arrancar el servidor (desde la raíz del repo):

```bash
npm install
npm start
```

Endpoints de ejemplo:

- POST `/api/usuarios/login`
  - Body: `{ "email": "ana@email.com", "password": "1234" }`
  - Respuesta: `{ "token": "...", "usuario": { "id": 123, "nombre": "Ana", ... } }`

- GET `/api/planes`
  - Devuelve los planes aprobados con la info del coach incluida.

- GET `/api/planes/45`
  - Devuelve todo el detalle del plan id 45, incluye `url_vista_previa`.

- POST `/api/usuarios/123/entrenamientos`
  - Body: `{ "fecha": "2024-05-21", "id_plan": 45 }`
  - Respuesta: `{ "mensaje": "Entrenamiento registrado" }`

Ejemplos `curl`:

```bash
# Login
curl -s -X POST http://localhost:3000/api/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@email.com","password":"1234"}'

# Listar planes
curl http://localhost:3000/api/planes

# Detalle plan 45
curl http://localhost:3000/api/planes/45

# Registrar entrenamiento
curl -s -X POST http://localhost:3000/api/usuarios/123/entrenamientos \
  -H "Content-Type: application/json" \
  -d '{"fecha":"2024-05-21","id_plan":45}'
```

Notas:
- Esta implementación es demo: las contraseñas están en texto plano en `data/users.json` y el JWT usa una "secret" corta. No usar así en producción.

Autenticación y roles
- Las contraseñas ahora se guardan hasheadas con `bcrypt`. Se añadió un script de migración `npm run hash-passwords` que convierte contraseñas planas a bcrypt.
- El token JWT incluye el `role` del usuario (`user`, `coach`, `admin`).
- El endpoint `POST /api/usuarios/:id/entrenamientos` está protegido: solo el propio usuario, un `coach` o un `admin` pueden registrar entrenamientos para un usuario.

Usuarios de ejemplo en `data/users.json`:
- `ana@email.com` (role: `user`)
- `mario@coaches.com` (role: `coach`)
- `admin@site.com` (role: `admin`)

Scripts útiles:
```bash
# Hashear contraseñas planas (si existen)
npm run hash-passwords

# Iniciar servidor
npm start
```

MVP — ejecutar localmente con SQLite
1. Instala dependencias:

```bash
npm install
```

2. (Opcional) Ejecuta el hash de contraseñas si aún hay planas:

```bash
npm run hash-passwords
```

3. Migra los JSON a SQLite (solo la primera vez):

```bash
node scripts/migrate_to_sqlite.js
```

4. Establece las variables de entorno o copia `.env.example` a `.env` y ajusta `JWT_SECRET`.

5. Inicia la app:

```bash
npm start
```

Opción Docker (MVP en contenedor):

```bash
# construir imagen
docker build -t fitness-marketplace:latest .

# ejecutar (pasa un secreto real por env)
docker run -e JWT_SECRET=mi_secreto_seguro -p 3000:3000 fitness-marketplace:latest
```
# GitHub Actions / Secrets

- Para que el workflow Docker pueda publicar la imagen en GitHub Container Registry (GHCR) no necesitas credenciales adicionales si usas el token interno: el workflow usa `secrets.GITHUB_TOKEN` por defecto. Sin embargo, para publicar en Docker Hub debes crear los secretos `DOCKERHUB_USERNAME` y `DOCKERHUB_TOKEN` en Settings → Secrets → Actions.

- Asegúrate de añadir un secreto `JWT_SECRET` (valor seguro) en `Settings → Secrets → Actions` para los entornos donde vayas a desplegar.

Pasos recomendados para mover a un ambiente de pruebas (beta)
- **1) Crear un entorno de staging**: usar un servicio como Render, Railway, Fly o un VPS. Elige uno y crea una app que exponga el puerto 3000.
- **2) Variables y secretos**: en el servicio de hosting configura `JWT_SECRET`, y cualquier otra variable (p.ej. `NODE_ENV=production`).
- **3) Persistencia de datos**: en staging usa una base de datos persistente (Postgres preferible). Actualizar `db.js` para conectar con Postgres (o usar SQLite con volumen persistente).
- **4) CI/CD**: el repo ya tiene un workflow de tests; añade un workflow adicional que haga `docker build` y despliegue a staging (o usa el workflow `docker-publish.yml` para publicar en GHCR y luego despliega desde allí).
- **5) Smoke tests y accesos**: una vez desplegado, realiza smoke tests automáticos (health endpoint, login básico, GET /api/planes).
- **6) Beta testers**: crea cuentas de prueba y comparte instrucciones (endpoints y token de ejemplo) para que testers validen flujos.

Si quieres, puedo:
- configurar el workflow para publicar también en Docker Hub (necesitaré que añadas los secretos),
- crear un workflow de deploy automático a un proveedor (Render/Railway) — dime cuál prefieres y preparo la acción.


Frontend (React + Tailwind)
----------------------------

El proyecto incluye un frontend React con Vite y Tailwind CSS en `frontend-react/`. Características:
- Pantalla de bienvenida (registro/login)
- Registro de nuevos usuarios
- Inicio de sesión
- Onboarding personalizado (objetivo, nivel, ubicación)
- Listado dinámico de planes desde la API
- Registro de entrenamientos completados
- Cierre de sesión

### Instalación y ejecución

1. Asegúrate de que el servidor backend está corriendo en el puerto 3000:

```bash
npm start
```

2. En otra terminal, instala dependencias del frontend React e inicia el servidor de desarrollo:

```bash
cd frontend-react
npm install
npm run dev
```

3. Abre `http://localhost:5173` en tu navegador (Vite por defecto usa puerto 5173).

El frontend hace peticiones a la API en `http://localhost:3000/api`. Los tokens JWT se almacenan en `localStorage` y se incluyen automáticamente en las peticiones autenticadas.

### Compilar para producción

```bash
cd frontend-react
npm run build
```

La compilación genera archivos optimizados en `frontend-react/dist/`. El servidor Express (en `index.js`) sirve automáticamente la build React si existe.

### Tailwind CSS

El proyecto usa Tailwind CSS con PostCSS. Los estilos están en `frontend-react/src/styles.css` con las directivas `@tailwind` habilitadas. Si necesitas personalizar temas o colores, edita `frontend-react/tailwind.config.cjs`.

### Usuarios de prueba

Usa los siguientes usuarios para probar:

- **Usuario**: `ana@email.com` / `1234`
- **Coach**: `mario@coaches.com` / `1234`
- **Admin**: `admin@site.com` / `1234`

O registra uno nuevo desde la pantalla de bienvenida.
