# Pruebas rápidas con Thunder Client

## 1) Inicializar base de datos

Ejecuta en terminal:

```bash
npm run db:setup
```

Esto crea el esquema y datos de prueba.

## 2) Levantar API

```bash
npm run dev
```

## 3) Validar conexión DB

- Método: `GET`
- URL: `http://localhost:3000/api/health/db`
- Resultado esperado: `ok: true` y nombre de base de datos activa.

## 4) Login de prueba

- Método: `POST`
- URL: `http://localhost:3000/api/auth/login`
- Body JSON:

```json
{
  "correo": "admin@brasilios.com",
  "password": "Admin123*"
}
```

Guarda el `accessToken`.

## 5) Crear cita (HU-2.1)

- Método: `POST`
- URL: `http://localhost:3000/api/citas`
- Header: `Authorization: Bearer <accessToken>`
- Body JSON:

```json
{
  "cliente_id": 3,
  "servicio_id": 1,
  "fecha": "2026-12-20",
  "hora": "10:00",
  "barbero_id": 2,
  "observaciones": "Prueba thunder client"
}
```

## 6) Disponibilidad (HU-2.3)

- Método: `GET`
- URL:
  `http://localhost:3000/api/citas/disponibilidad?fecha=2026-12-20&hora=10:00&servicio_id=1&barbero_id=2`
- Header: `Authorization: Bearer <accessToken>`

## 7) Notificaciones (HU-2.6 / HU-2.7)

- Método: `GET`
- URL: `http://localhost:3000/api/notificaciones`
- Header: `Authorization: Bearer <accessToken>`
