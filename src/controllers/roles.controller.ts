import { Request, Response } from 'express';
import { RolesService } from '../services/roles.service';
import * as R from '../utils/response';

// GET /roles
export async function listarRoles(req: Request, res: Response): Promise<void> {
  try {
    const roles = await RolesService.listarRoles();
    R.ok(res, 'Roles obtenidos', roles);
  } catch (err: any) {
    R.serverError(res, err.message);
  }
}

// GET /roles/permisos
export async function listarPermisos(req: Request, res: Response): Promise<void> {
  try {
    const permisos = await RolesService.listarPermisos();
    R.ok(res, 'Permisos obtenidos', permisos);
  } catch (err: any) {
    R.serverError(res, err.message);
  }
}

// PUT /roles/:id/permisos  — HU-1.7
export async function actualizarPermisosRol(req: Request, res: Response): Promise<void> {
  try {
    const rolId       = Number(req.params.id);
    const { permisos_ids } = req.body;
    const ip          = req.ip || '';
    const userAgent   = req.headers['user-agent'] || '';

    await RolesService.actualizarPermisosRol(rolId, permisos_ids, req.usuario!.id, ip, userAgent);
    R.ok(res, 'Permisos del rol actualizados exitosamente');
  } catch (err: any) {
    const status = err.status || 500;
    if (status === 404) R.notFound(res, err.message);
    else R.serverError(res, err.message);
  }
}

// PUT /roles/asignar  — HU-1.7
export async function asignarRolUsuario(req: Request, res: Response): Promise<void> {
  try {
    const { usuario_id, rol_id } = req.body;
    const ip        = req.ip || '';
    const userAgent = req.headers['user-agent'] || '';

    await RolesService.asignarRolUsuario(usuario_id, rol_id, req.usuario!.id, ip, userAgent);
    R.ok(res, 'Rol asignado exitosamente');
  } catch (err: any) {
    const status = err.status || 500;
    if (status === 404) R.notFound(res, err.message);
    else R.serverError(res, err.message);
  }
}
