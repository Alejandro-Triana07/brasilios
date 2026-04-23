import { Router } from 'express';
import * as CitasController from '../controllers/citas.controller';
import { autenticar } from '../middlewares/auth.middleware';
import { validar, cancelarCitaSchema, crearCitaSchema, modificarCitaSchema } from '../middlewares/validar.middleware';

const router = Router();

router.use(autenticar);

router.get('/disponibilidad', CitasController.validarDisponibilidad);
router.get('/barberos-disponibles', CitasController.listarBarberosDisponibles);

router.post('/', validar(crearCitaSchema), CitasController.crearCita);
router.put('/:id', validar(modificarCitaSchema), CitasController.modificarCita);
router.post('/:id/cancelar', validar(cancelarCitaSchema), CitasController.cancelarCita);

router.post('/recordatorios/ejecutar', CitasController.ejecutarRecordatorios);

export default router;
