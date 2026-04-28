import { Request, Response, NextFunction } from 'express';
import { verificarAccessToken } from '../utils/jwt';
import { estaRevocado } from '../services/auth.service';
import { forbidden, unauthorized } from '../utils/response';

// Extender el tipo Request para incluir el usuario autenticado
declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id: number;
        correo: string;
        rol: string;
      };
    }
  }
}

// -------------------------------------------------------
// Middleware: verificar JWT y cargar usuario en req
// -------------------------------------------------------
export async function autenticar(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    unauthorized(res, 'Token no proporcionado');
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verificarAccessToken(token);

    // Verificar que el token no esté revocado (logout)
    if (await estaRevocado(payload.jti)) {
      unauthorized(res, 'Sesión cerrada. Inicie sesión nuevamente.');
      return;
    }

    req.usuario = {
      id:     payload.sub,
      correo: payload.correo,
      rol:    payload.rol,
    };

    next();
  } catch {
    unauthorized(res, 'Token inválido o expirado');
  }
}

// -------------------------------------------------------
// Middleware: restringir acceso por rol
// -------------------------------------------------------
export function soloRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      forbidden(res, 'No tienes permisos para acceder a este módulo');
      return;
    }
    next();
  };
}

// -------------------------------------------------------
// Middleware: verificar permiso específico en BD
// -------------------------------------------------------
export function requierePermiso(modulo: string, accion: string) {
  const permisosPorRol: Record<string, string[]> = {
    admin: ['*'],
    barbero: ['citas:ver', 'citas:editar', 'clientes:ver', 'notificaciones:ver'],
    cliente: ['citas:crear', 'citas:ver', 'citas:cancelar', 'notificaciones:ver'],
  };

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.usuario) {
      unauthorized(res, 'No autenticado');
      return;
    }

    const permiso = `${modulo}:${accion}`;
    const permisos = permisosPorRol[req.usuario.rol] ?? [];
    const autorizado = permisos.includes('*') || permisos.includes(permiso);

    if (!autorizado) {
      forbidden(res, 'No tienes permisos para realizar esta acción');
      return;
    }

    next();
  };
}
