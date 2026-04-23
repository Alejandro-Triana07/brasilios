"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registroSchema = exports.actualizarPermisosSchema = exports.asignarRolSchema = exports.resetearPasswordSchema = exports.verificarCodigoSchema = exports.solicitarRecuperacionSchema = exports.loginSchema = void 0;
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
//# sourceMappingURL=validar.middleware.js.map