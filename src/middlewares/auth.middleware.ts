import { Request, Response, NextFunction } from 'express';
import { verificarAccessToken } from '../utils/jwt';
import { estaRevocado } from '../services/auth.service';
import { pool } from '../config/database';
import { forbidden, unauthorized } from '../utils/response';
import { RowDataPacket } from 'mysql2';

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
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.usuario) {
      unauthorized(res, 'No autenticado');
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT rp.permiso_id
       FROM rol_permisos rp
       JOIN permisos p  ON p.id  = rp.permiso_id
       JOIN roles    r  ON r.id  = rp.rol_id
       WHERE r.nombre = ? AND p.modulo = ? AND p.accion = ?`,
      [req.usuario.rol, modulo, accion]
    );

    if (rows.length === 0) {
      forbidden(res, 'No tienes permisos para realizar esta acción');
      return;
    }

    next();
  };
}
