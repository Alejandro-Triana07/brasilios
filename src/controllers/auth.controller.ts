import { Request, Response } from 'express';
import * as AuthService from '../services/auth.service';
import * as R from '../utils/response';


// HU-1.1 / HU-1.2 — Login
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { correo, password } = req.body;
    const ip        = req.ip || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    const result = await AuthService.login(correo, password, ip, userAgent);
    R.ok(res, 'Inicio de sesión exitoso', result);
  } catch (err: any) {
    const status = err.status || 500;
    if (status === 500) R.serverError(res, err.message);
    else if (status === 403) R.forbidden(res, err.message);
    else R.unauthorized(res, err.message);
  }
}

// HU-1.6 — Logout
export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const token     = req.headers.authorization!.split(' ')[1];
    const ip        = req.ip || '';
    const userAgent = req.headers['user-agent'] || '';

    await AuthService.logout(token, req.usuario!.id, ip, userAgent);
    R.ok(res, 'Sesión cerrada exitosamente');
  } catch (err: any) {
    R.serverError(res, err.message);
  }
}

// HU-1.3 / HU-1.4 — Solicitar código de recuperación
export async function solicitarRecuperacion(req: Request, res: Response): Promise<void> {
  try {
    const { correo } = req.body;
    await AuthService.solicitarRecuperacion(correo);
    R.ok(res, 'Código de verificación enviado al correo registrado');
  } catch (err: any) {
    const status = err.status || 500;
    if (status === 404) R.notFound(res, err.message);
    else R.serverError(res, err.message);
  }
}

// HU-1.4 — Verificar código
export async function verificarCodigo(req: Request, res: Response): Promise<void> {
  try {
    const { correo, codigo } = req.body;
    await AuthService.verificarCodigo(correo, codigo);
    R.ok(res, 'Código válido. Puede establecer una nueva contraseña.');
  } catch (err: any) {
    const status = err.status || 500;
    if (status === 404) R.notFound(res, err.message);
    else if (status === 400) R.badRequest(res, err.message);
    else R.serverError(res, err.message);
  }
}

// HU-1.5 — Resetear contraseña
export async function resetearPassword(req: Request, res: Response): Promise<void> {
  try {
    const { correo, codigo, nueva_password } = req.body;
    await AuthService.resetearPassword(correo, codigo, nueva_password);
    R.ok(res, 'Contraseña actualizada exitosamente');
  } catch (err: any) {
    const status = err.status || 500;
    if (status === 400) R.badRequest(res, err.message);
    else if (status === 404) R.notFound(res, err.message);
    else R.serverError(res, err.message);
  }
}

// -------------------------------------------------------
// CONTROLLER — agrega esta función a tu auth.controller.ts
// -------------------------------------------------------
export async function registro(req: Request, res: Response): Promise<void> {
  try {
    const { nombre, correo, password } = req.body;
    const ip        = req.ip || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    const result = await AuthService.registro(nombre, correo, password, ip, userAgent);
    R.ok(res, 'Usuario registrado exitosamente', result);
  } catch (err: any) {
    const status = err.status || 500;
    if (status === 400) R.badRequest(res, err.message);
    else if (status === 409) R.conflict(res, err.message);
    else R.serverError(res, err.message);
  }
}


