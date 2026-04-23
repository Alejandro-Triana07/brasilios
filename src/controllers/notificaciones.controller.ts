import { Request, Response } from 'express';
import { NotificacionesService } from '../services/notificaciones.service';
import * as R from '../utils/response';

export async function listarMisNotificaciones(req: Request, res: Response): Promise<void> {
  try {
    const data = await NotificacionesService.listarPorUsuario(req.usuario!.id);
    R.ok(res, 'Notificaciones obtenidas', data);
  } catch (err: any) {
    R.serverError(res, err.message);
  }
}

export async function marcarNotificacionLeida(req: Request, res: Response): Promise<void> {
  try {
    await NotificacionesService.marcarLeida(Number(req.params.id), req.usuario!.id);
    R.ok(res, 'Notificación marcada como leída');
  } catch (err: any) {
    const status = err.status || 500;
    if (status === 404) {
      R.notFound(res, err.message);
      return;
    }
    R.serverError(res, err.message);
  }
}
