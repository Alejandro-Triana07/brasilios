import { Request, Response } from 'express';
import { CitasService } from '../services/citas.service';
import * as R from '../utils/response';

export async function listarCitas(req: Request, res: Response): Promise<void> {
  try {
    const citas = await CitasService.listarCitas(req.usuario!.id, req.usuario!.rol);
    R.ok(res, 'Citas obtenidas correctamente', citas);
  } catch (err: any) {
    R.serverError(res, err.message);
  }
}

export async function obtenerCita(req: Request, res: Response): Promise<void> {
  try {
    const cita = await CitasService.obtenerCitaPorId(Number(req.params.id), req.usuario!.id, req.usuario!.rol);
    R.ok(res, 'Cita obtenida correctamente', cita);
  } catch (err: any) {
    const status = err.status || 500;
    if (status === 404) R.notFound(res, err.message);
    else R.serverError(res, err.message);
  }
}

export async function crearCita(req: Request, res: Response): Promise<void> {
  try {
    const { cliente_id, servicio_id, fecha, hora, barbero_id } = req.body;
    if (req.usuario!.rol === 'cliente' && req.usuario!.id !== cliente_id) {
      R.forbidden(res, 'Un cliente solo puede registrar citas para su propia cuenta');
      return;
    }

    const result = await CitasService.crearCita({
      cliente_id,
      servicio_id,
      fecha,
      hora,
      barbero_id,
      creado_por: req.usuario!.id,
    });

    R.created(res, 'Cita registrada correctamente', result);
  } catch (err: any) {
    const status = err.status || 500;
    if (status === 400) R.badRequest(res, err.message);
    else if (status === 403) R.forbidden(res, err.message);
    else if (status === 404) R.notFound(res, err.message);
    else if (status === 409) R.conflict(res, err.message);
    else R.serverError(res, err.message);
  }
}

export async function validarDisponibilidad(req: Request, res: Response): Promise<void> {
  try {
    const { fecha, hora, servicio_id, barbero_id } = req.query;
    if (!barbero_id) {
      R.badRequest(res, 'Debe enviar barbero_id para validar disponibilidad');
      return;
    }

    const result = await CitasService.validarDisponibilidad(
      String(fecha),
      String(hora),
      Number(servicio_id),
      Number(barbero_id)
    );
    R.ok(res, 'Disponibilidad consultada', result);
  } catch (err: any) {
    const status = err.status || 500;
    if (status === 400) R.badRequest(res, err.message);
    else if (status === 404) R.notFound(res, err.message);
    else R.serverError(res, err.message);
  }
}

export async function listarBarberosDisponibles(req: Request, res: Response): Promise<void> {
  try {
    const { fecha, hora, servicio_id } = req.query;
    const result = await CitasService.listarBarberosDisponibles(
      String(fecha),
      String(hora),
      Number(servicio_id)
    );
    R.ok(res, 'Barberos disponibles obtenidos', result);
  } catch (err: any) {
    const status = err.status || 500;
    if (status === 400) R.badRequest(res, err.message);
    else R.serverError(res, err.message);
  }
}

export async function modificarCita(req: Request, res: Response): Promise<void> {
  try {
    const citaId = Number(req.params.id);

    await CitasService.modificarCita(citaId, {
      ...req.body,
      actualizado_por: req.usuario!.id,
      rol_usuario: req.usuario!.rol,
    });
    R.ok(res, 'Cita modificada correctamente');
  } catch (err: any) {
    const status = err.status || 500;
    if (status === 400) R.badRequest(res, err.message);
    else if (status === 403) R.forbidden(res, err.message);
    else if (status === 404) R.notFound(res, err.message);
    else if (status === 409) R.conflict(res, err.message);
    else R.serverError(res, err.message);
  }
}

export async function cancelarCita(req: Request, res: Response): Promise<void> {
  try {
    const citaId = Number(req.params.id);
    await CitasService.cancelarCita(citaId, req.usuario!.id, req.usuario!.rol);
    R.ok(res, 'Cita cancelada correctamente');
  } catch (err: any) {
    const status = err.status || 500;
    if (status === 400) R.badRequest(res, err.message);
    else if (status === 403) R.forbidden(res, err.message);
    else if (status === 404) R.notFound(res, err.message);
    else R.serverError(res, err.message);
  }
}

export async function ejecutarRecordatorios(req: Request, res: Response): Promise<void> {
  try {
    const result = await CitasService.ejecutarRecordatoriosAutomaticos();
    R.ok(res, 'Recordatorios procesados', result);
  } catch (err: any) {
    R.serverError(res, err.message);
  }
}

export async function eliminarCita(req: Request, res: Response): Promise<void> {
  try {
    await CitasService.eliminarCita(Number(req.params.id), req.usuario!.id, req.usuario!.rol);
    R.ok(res, 'Cita eliminada correctamente');
  } catch (err: any) {
    const status = err.status || 500;
    if (status === 400) R.badRequest(res, err.message);
    else if (status === 404) R.notFound(res, err.message);
    else R.serverError(res, err.message);
  }
}
