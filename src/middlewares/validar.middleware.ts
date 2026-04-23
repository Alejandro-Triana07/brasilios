import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { badRequest } from '../utils/response';

export function validar(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errores = result.error.errors.map(e => e.message);
      badRequest(res, 'Datos inválidos', errores);
      return;
    }
    req.body = result.data;
    next();
  };
}

// -------------------------------------------------------
// Schemas de validación
// -------------------------------------------------------
export const loginSchema = z.object({
  correo:   z.string().email('Correo inválido').min(1, 'El correo es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const solicitarRecuperacionSchema = z.object({
  correo: z.string().email('Correo inválido'),
});

export const verificarCodigoSchema = z.object({
  correo: z.string().email('Correo inválido'),
  codigo: z.string().length(6, 'El código debe tener 6 dígitos'),
});

export const resetearPasswordSchema = z.object({
  correo:          z.string().email('Correo inválido'),
  codigo:          z.string().length(6, 'El código debe tener 6 dígitos'),
  nueva_password:  z.string().min(8, 'La contraseña debe tener mínimo 8 caracteres'),
  confirmar_password: z.string(),
}).refine(data => data.nueva_password === data.confirmar_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmar_password'],
});

export const asignarRolSchema = z.object({
  usuario_id: z.number().int().positive('ID de usuario inválido'),
  rol_id:     z.number().int().positive('ID de rol inválido'),
});

export const actualizarPermisosSchema = z.object({
  permisos_ids: z.array(z.number().int().positive()).min(0),
});



export const registroSchema = z.object({
  nombre:   z.string().min(2, 'El nombre debe tener mínimo 2 caracteres'),
  correo:   z.string().email('Correo inválido'),
  password: z.string()
    .min(8, 'La contraseña debe tener mínimo 8 caracteres')
    .regex(/[A-Z]/,    'Debe tener al menos una mayúscula')
    .regex(/[a-z]/,    'Debe tener al menos una minúscula')
    .regex(/\d/,       'Debe tener al menos un número')
    .regex(/[\W_]/,    'Debe tener al menos un símbolo'),
  confirmar_password: z.string(),
}).refine(data => data.password === data.confirmar_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmar_password'],
});