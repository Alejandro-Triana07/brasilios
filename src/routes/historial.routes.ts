import { Router } from 'express';
import { listarHistorial } from '../controllers/historial.controller';
import { autenticar } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/historial
router.get('/', autenticar, listarHistorial);

export default router;
