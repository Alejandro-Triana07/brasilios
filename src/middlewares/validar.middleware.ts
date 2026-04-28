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

export const crearCitaSchema = z.object({
  cliente_id: z.number().int().positive('El cliente es requerido'),
  servicio_id: z.number().int().positive('El servicio es requerido'),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD'),
  hora: z.string().regex(/^\d{2}:\d{2}$/, 'La hora debe tener formato HH:mm'),
  barbero_id: z.number().int().positive().optional(),
  observaciones: z.string().max(500).optional(),
});

export const modificarCitaSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD').optional(),
  hora: z.string().regex(/^\d{2}:\d{2}$/, 'La hora debe tener formato HH:mm').optional(),
  barbero_id: z.number().int().positive().optional(),
  servicio_id: z.number().int().positive().optional(),
  observaciones: z.string().max(500).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debe enviar al menos un campo para modificar',
});

export const cancelarCitaSchema = z.object({
  confirmar: z.boolean(),
}).refine((data) => data.confirmar === true, {
  message: 'Debe confirmar la cancelación de la cita',
  path: ['confirmar'],
});

export const disponibilidadSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD'),
  hora: z.string().regex(/^\d{2}:\d{2}$/, 'La hora debe tener formato HH:mm'),
  servicio_id: z.coerce.number().int().positive('El servicio es requerido'),
  barbero_id: z.coerce.number().int().positive().optional(),
});

export const crearClienteSchema = z.object({
  nombre: z.string().min(2, 'El nombre es requerido'),
  telefono: z.string().min(7, 'El teléfono es requerido').max(20, 'Teléfono inválido'),
  correo: z.string().email('Correo inválido'),
});

export const actualizarClienteSchema = z.object({
  nombre: z.string().min(2, 'Nombre inválido').optional(),
  telefono: z.string().min(7, 'Teléfono inválido').max(20, 'Teléfono inválido').optional(),
  correo: z.string().email('Correo inválido').optional(),
  activo: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar',
});