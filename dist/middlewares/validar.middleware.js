"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actualizarClienteSchema = exports.crearClienteSchema = exports.disponibilidadSchema = exports.cancelarCitaSchema = exports.modificarCitaSchema = exports.crearCitaSchema = exports.registroSchema = exports.actualizarPermisosSchema = exports.asignarRolSchema = exports.resetearPasswordSchema = exports.verificarCodigoSchema = exports.solicitarRecuperacionSchema = exports.loginSchema = void 0;
exports.validar = validar;
const zod_1 = require("zod");
const response_1 = require("../utils/response");
function validar(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const errores = result.error.errors.map(e => e.message);
            (0, response_1.badRequest)(res, 'Datos inválidos', errores);
            return;
        }
        req.body = result.data;
        next();
    };
}
// -------------------------------------------------------
// Schemas de validación
// -------------------------------------------------------
exports.loginSchema = zod_1.z.object({
    correo: zod_1.z.string().email('Correo inválido').min(1, 'El correo es requerido'),
    password: zod_1.z.string().min(1, 'La contraseña es requerida'),
});
exports.solicitarRecuperacionSchema = zod_1.z.object({
    correo: zod_1.z.string().email('Correo inválido'),
});
exports.verificarCodigoSchema = zod_1.z.object({
    correo: zod_1.z.string().email('Correo inválido'),
    codigo: zod_1.z.string().length(6, 'El código debe tener 6 dígitos'),
});
exports.resetearPasswordSchema = zod_1.z.object({
    correo: zod_1.z.string().email('Correo inválido'),
    codigo: zod_1.z.string().length(6, 'El código debe tener 6 dígitos'),
    nueva_password: zod_1.z.string().min(8, 'La contraseña debe tener mínimo 8 caracteres'),
    confirmar_password: zod_1.z.string(),
}).refine(data => data.nueva_password === data.confirmar_password, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmar_password'],
});
exports.asignarRolSchema = zod_1.z.object({
    usuario_id: zod_1.z.number().int().positive('ID de usuario inválido'),
    rol_id: zod_1.z.number().int().positive('ID de rol inválido'),
});
exports.actualizarPermisosSchema = zod_1.z.object({
    permisos_ids: zod_1.z.array(zod_1.z.number().int().positive()).min(0),
});
exports.registroSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(2, 'El nombre debe tener mínimo 2 caracteres'),
    correo: zod_1.z.string().email('Correo inválido'),
    password: zod_1.z.string()
        .min(8, 'La contraseña debe tener mínimo 8 caracteres')
        .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
        .regex(/[a-z]/, 'Debe tener al menos una minúscula')
        .regex(/\d/, 'Debe tener al menos un número')
        .regex(/[\W_]/, 'Debe tener al menos un símbolo'),
    confirmar_password: zod_1.z.string(),
}).refine(data => data.password === data.confirmar_password, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmar_password'],
});
exports.crearCitaSchema = zod_1.z.object({
    cliente_id: zod_1.z.number().int().positive('El cliente es requerido'),
    servicio_id: zod_1.z.number().int().positive('El servicio es requerido'),
    fecha: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD'),
    hora: zod_1.z.string().regex(/^\d{2}:\d{2}$/, 'La hora debe tener formato HH:mm'),
    barbero_id: zod_1.z.number().int().positive().optional(),
    observaciones: zod_1.z.string().max(500).optional(),
});
exports.modificarCitaSchema = zod_1.z.object({
    fecha: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD').optional(),
    hora: zod_1.z.string().regex(/^\d{2}:\d{2}$/, 'La hora debe tener formato HH:mm').optional(),
    barbero_id: zod_1.z.number().int().positive().optional(),
    servicio_id: zod_1.z.number().int().positive().optional(),
    observaciones: zod_1.z.string().max(500).optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para modificar',
});
exports.cancelarCitaSchema = zod_1.z.object({
    confirmar: zod_1.z.boolean(),
}).refine((data) => data.confirmar === true, {
    message: 'Debe confirmar la cancelación de la cita',
    path: ['confirmar'],
});
exports.disponibilidadSchema = zod_1.z.object({
    fecha: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD'),
    hora: zod_1.z.string().regex(/^\d{2}:\d{2}$/, 'La hora debe tener formato HH:mm'),
    servicio_id: zod_1.z.coerce.number().int().positive('El servicio es requerido'),
    barbero_id: zod_1.z.coerce.number().int().positive().optional(),
});
exports.crearClienteSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(2, 'El nombre es requerido'),
    telefono: zod_1.z.string().min(7, 'El teléfono es requerido').max(20, 'Teléfono inválido'),
    correo: zod_1.z.string().email('Correo inválido'),
});
exports.actualizarClienteSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(2, 'Nombre inválido').optional(),
    telefono: zod_1.z.string().min(7, 'Teléfono inválido').max(20, 'Teléfono inválido').optional(),
    correo: zod_1.z.string().email('Correo inválido').optional(),
    activo: zod_1.z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar',
});
//# sourceMappingURL=validar.middleware.js.map