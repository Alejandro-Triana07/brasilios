"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autenticar = autenticar;
exports.soloRoles = soloRoles;
exports.requierePermiso = requierePermiso;
const jwt_1 = require("../utils/jwt");
const auth_service_1 = require("../services/auth.service");
const database_1 = require("../config/database");
const response_1 = require("../utils/response");
// -------------------------------------------------------
// Middleware: verificar JWT y cargar usuario en req
// -------------------------------------------------------
async function autenticar(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        (0, response_1.unauthorized)(res, 'Token no proporcionado');
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = (0, jwt_1.verificarAccessToken)(token);
        // Verificar que el token no esté revocado (logout)
        if (await (0, auth_service_1.estaRevocado)(payload.jti)) {
            (0, response_1.unauthorized)(res, 'Sesión cerrada. Inicie sesión nuevamente.');
            return;
        }
        req.usuario = {
            id: payload.sub,
            correo: payload.correo,
            rol: payload.rol,
        };
        next();
    }
    catch {
        (0, response_1.unauthorized)(res, 'Token inválido o expirado');
    }
}
// -------------------------------------------------------
// Middleware: restringir acceso por rol
// -------------------------------------------------------
function soloRoles(...roles) {
    return (req, res, next) => {
        if (!req.usuario || !roles.includes(req.usuario.rol)) {
            (0, response_1.forbidden)(res, 'No tienes permisos para acceder a este módulo');
            return;
        }
        next();
    };
}
// -------------------------------------------------------
// Middleware: verificar permiso específico en BD
// -------------------------------------------------------
function requierePermiso(modulo, accion) {
    return async (req, res, next) => {
        if (!req.usuario) {
            (0, response_1.unauthorized)(res, 'No autenticado');
            return;
        }
        const [rows] = await database_1.pool.query(`SELECT rp.permiso_id
       FROM rol_permisos rp
       JOIN permisos p  ON p.id  = rp.permiso_id
       JOIN roles    r  ON r.id  = rp.rol_id
       WHERE r.nombre = ? AND p.modulo = ? AND p.accion = ?`, [req.usuario.rol, modulo, accion]);
        if (rows.length === 0) {
            (0, response_1.forbidden)(res, 'No tienes permisos para realizar esta acción');
            return;
        }
        next();
    };
}
//# sourceMappingURL=auth.middleware.js.map