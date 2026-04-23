import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database';

// Rutas
import authRoutes     from './routes/auth.routes';
import historialRoutes from './routes/historial.routes';
import rolesRoutes    from './routes/roles.routes';
import citasRoutes from './routes/citas.routes';
import notificacionesRoutes from './routes/notificaciones.routes';

dotenv.config();

const app: Application = express();

// ─── Middlewares globales ─────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Rutas ────────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/roles',     rolesRoutes);
app.use('/api/citas',     citasRoutes);
app.use('/api/notificaciones', notificacionesRoutes);

// ─── Ruta base ────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ ok: true, mensaje: 'API Brasilios funcionando ✅' });
});

// ─── Servidor ─────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT || 3000);

async function bootstrap(): Promise<void> {
  await testConnection();

  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('No se pudo iniciar la API:', error);
  process.exit(1);
});

export default app;
