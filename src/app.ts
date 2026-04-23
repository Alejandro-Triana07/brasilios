import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Rutas
import authRoutes     from './routes/auth.routes';
import historialRoutes from './routes/historial.routes';
import rolesRoutes    from './routes/roles.routes';

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

// ─── Ruta base ────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ ok: true, mensaje: 'API Brasilios funcionando ✅' });
});

// ─── Servidor ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

export default app;
