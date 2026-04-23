import { Router } from 'express';
import { autenticar } from '../middlewares/auth.middleware';
import * as NotificacionesController from '../controllers/notificaciones.controller';

const router = Router();

router.use(autenticar);

router.get('/', NotificacionesController.listarMisNotificaciones);
router.patch('/:id/leida', NotificacionesController.marcarNotificacionLeida);

export default router;
