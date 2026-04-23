import { Request, Response } from 'express';
import { HistorialService } from '../services/historial.service';
import { FiltroHistorial, AccionHistorial } from '../types';
import * as R from '../utils/response';

// GET /historial
export async function listarHistorial(req: Request, res: Response): Promise<void> {
  try {
    const filtros: FiltroHistorial = {
      fechaDesde: req.query.fechaDesde as string,
      fechaHasta: req.query.fechaHasta as string,
      usuarioId:  req.query.usuarioId ? Number(req.query.usuarioId) : undefined,
      modulo:     req.query.modulo    as string,
      accion:     req.query.accion    as AccionHistorial,
      pagina:     req.query.pagina    ? Number(req.query.pagina)  : 1,
      limite:     req.query.limite    ? Number(req.query.limite)  : 20,
    };

    const resultado = await HistorialService.listar(filtros);
    R.ok(res, 'Historial obtenido', resultado);
  } catch (err: any) {
    R.serverError(res, err.message);
  }
}
