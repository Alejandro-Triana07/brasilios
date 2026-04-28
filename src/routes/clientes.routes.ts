import { Router } from 'express';
import * as ClientesController from '../controllers/clientes.controller';
import { autenticar, soloRoles } from '../middlewares/auth.middleware';
import { actualizarClienteSchema, crearClienteSchema, validar } from '../middlewares/validar.middleware';

const router = Router();

router.use(autenticar, soloRoles('admin', 'barbero'));

router.get('/', ClientesController.listarClientes);
router.get('/:id', ClientesController.obtenerCliente);
router.get('/:id/historial', ClientesController.historialServiciosCliente);
router.post('/', validar(crearClienteSchema), ClientesController.crearCliente);
router.put('/:id', validar(actualizarClienteSchema), ClientesController.actualizarCliente);
router.delete('/:id', ClientesController.eliminarCliente);

export default router;
