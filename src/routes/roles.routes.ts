import { Router } from 'express';
import * as RolesController from '../controllers/roles.controller';
import { autenticar, soloRoles, requierePermiso } from '../middlewares/auth.middleware';
import { validar, asignarRolSchema, actualizarPermisosSchema } from '../middlewares/validar.middleware';

const router = Router();

// Todas las rutas de roles requieren autenticación + rol admin
router.use(autenticar, soloRoles('admin'));

// GET /roles
router.get('/',          RolesController.listarRoles);

// GET /roles/permisos
router.get('/permisos',  RolesController.listarPermisos);

// PUT /roles/asignar — asignar rol a un usuario
router.put('/asignar',
  requierePermiso('roles', 'gestionar'),
  validar(asignarRolSchema),
  RolesController.asignarRolUsuario
);

// PUT /roles/:id/permisos — actualizar permisos de un rol
router.put('/:id/permisos',
  requierePermiso('roles', 'gestionar'),
  validar(actualizarPermisosSchema),
  RolesController.actualizarPermisosRol
);

export default router;
