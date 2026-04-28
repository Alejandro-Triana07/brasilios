import { Request, Response } from 'express';
import * as R from '../utils/response';
import { ClientesService } from '../services/clientes.service';

export async function crearCliente(req: Request, res: Response): Promise<void> {
  try {
    const { nombre, telefono, correo } = req.body;
    const result = await ClientesService.crearCliente({
      nombre,
      telefono,
      correo,
      adminId: req.usuario!.id,
    });
    R.created(res, 'Cliente registrado correctamente', result);
  } catch (err: any) {
    const status = err.status || 500;
    if (status === 409) R.conflict(res, err.message);
    else if (status === 400) R.badRequest(res, err.message);
    else R.serverError(res, err.message);
  }
}

export async function listarClientes(req: Request, res: Response): Promise<void> {
  try {
    const filtro = req.query.filtro ? String(req.query.filtro) : undefined;
    const rows = await ClientesService.listarClientes(filtro);
    if (rows.length === 0) {
      R.ok(res, 'No se encontraron clientes con ese criterio', []);
      return;
    }
    R.ok(res, 'Clientes obtenidos correctamente', rows);
  } catch (err: any) {
    R.serverError(res, err.message);
  }
}

export async function obtenerCliente(req: Request, res: Response): Promise<void> {
  try {
    const row = await ClientesService.obtenerClientePorId(Number(req.params.id));
    R.ok(res, 'Cliente obtenido correctamente', row);
  } catch (err: any) {
    const status = err.status || 500;
    if (status === 404) R.notFound(res, err.message);
    else R.serverError(res, err.message);
  }
}

export async function actualizarCliente(req: Request, res: Response): Promise<void> {
  try {
    await ClientesService.actualizarCliente(Number(req.params.id), {
      ...req.body,
      adminId: req.usuario!.id,
    });
    R.ok(res, 'Cliente actualizado correctamente');
  } catch (err: any) {
    const status = err.status || 500;
    if (status === 404) R.notFound(res, err.message);
    else if (status === 409) R.conflict(res, err.message);
    else R.serverError(res, err.message);
  }
}

export async function eliminarCliente(req: Request, res: Response): Promise<void> {
  try {
    await ClientesService.eliminarCliente(Number(req.params.id), req.usuario!.id);
    R.ok(res, 'Cliente eliminado correctamente');
  } catch (err: any) {
    const status = err.status || 500;
    if (status === 404) R.notFound(res, err.message);
    else R.serverError(res, err.message);
  }
}

export async function historialServiciosCliente(req: Request, res: Response): Promise<void> {
  try {
    const rows = await ClientesService.historialServiciosCliente(Number(req.params.id));
    if (rows.length === 0) {
      R.ok(res, 'El cliente no tiene historial de servicios', []);
      return;
    }
    R.ok(res, 'Historial de servicios obtenido', rows);
  } catch (err: any) {
    const status = err.status || 500;
    if (status === 404) R.notFound(res, err.message);
    else R.serverError(res, err.message);
  }
}
