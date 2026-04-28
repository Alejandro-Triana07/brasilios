"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.logout = logout;
exports.solicitarRecuperacion = solicitarRecuperacion;
exports.verificarCodigo = verificarCodigo;
exports.resetearPassword = resetearPassword;
exports.estaRevocado = estaRevocado;
exports.registro = registro;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../config/database");
const historial_service_1 = require("./historial.service");
const jwt_1 = require("../utils/jwt");
// -------------------------------------------------------
// HU-1.1 / HU-1.2  Autenticación y verificación
// -------------------------------------------------------
async function login(correo, password, ip, userAgent) {
    const [rows] = await database_1.pool.query(`SELECT id_usuario, nombre, apellido, correo_electronico, contrasena, rol, estado
     FROM usuario_rol
     WHERE correo_electronico = ?`, [correo]);
    if (rows.length === 0) {
        throw { status: 401, message: 'Usuario no registrado' };
    }
    const usuario = rows[0];
    if (usuario.estado !== 'activo') {
        throw { status: 403, message: 'Cuenta inactiva. Contacte al administrador.' };
    }
    const passwordCorrecta = await bcryptjs_1.default.compare(password, usuario.contrasena);
    if (!passwordCorrecta) {
        throw { status: 401, message: 'Contraseña incorrecta' };
    }
    const accessToken = (0, jwt_1.generarAccessToken)({ sub: usuario.id_usuario, rol: usuario.rol, correo: usuario.correo_electronico });
    const refreshToken = (0, jwt_1.generarRefreshToken)(usuario.id_usuario);
    await historial_service_1.HistorialService.registrar({
        usuario_id: usuario.id_usuario,
        accion: 'LOGIN',
        modulo: 'autenticacion',
        descripcion: 'Inicio de sesión exitoso',
        ip_address: ip,
        user_agent: userAgent,
    });
    return { accessToken, refreshToken, rol: usuario.rol };
}
// -------------------------------------------------------
// HU-1.6  Cierre de sesión seguro (blacklist del JTI)
// -------------------------------------------------------
async function logout(_token, usuarioId, ip, userAgent) {
    await historial_service_1.HistorialService.registrar({
        usuario_id: usuarioId,
        accion: 'LOGOUT',
        modulo: 'autenticacion',
        descripcion: 'Cierre de sesión',
        ip_address: ip,
        user_agent: userAgent,
    });
}
// -------------------------------------------------------
// HU-1.3 / HU-1.4  Solicitar código de recuperación
// -------------------------------------------------------
async function solicitarRecuperacion(correo) {
    const [rows] = await database_1.pool.query(`SELECT id_usuario FROM usuario_rol WHERE correo_electronico = ?`, [correo]);
    if (rows.length === 0)
        throw { status: 404, message: 'Usuario no registrado' };
    throw { status: 501, message: 'Recuperación por código no está habilitada en el nuevo esquema.' };
}
// -------------------------------------------------------
// HU-1.4  Verificar código de recuperación
// -------------------------------------------------------
async function verificarCodigo(correo, codigo) {
    void correo;
    void codigo;
    throw { status: 501, message: 'Recuperación por código no está habilitada en el nuevo esquema.' };
}
// -------------------------------------------------------
// HU-1.5  Establecer nueva contraseña
// -------------------------------------------------------
async function resetearPassword(correo, _codigo, nuevaPassword) {
    const passwordSegura = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(nuevaPassword);
    if (!passwordSegura) {
        throw {
            status: 400,
            message: 'Contraseña insegura. Debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.',
        };
    }
    const [userRows] = await database_1.pool.query(`SELECT id_usuario, contrasena FROM usuario_rol WHERE correo_electronico = ?`, [correo]);
    if (userRows.length === 0)
        throw { status: 404, message: 'Usuario no registrado' };
    const usuario = userRows[0];
    const esRepetida = await bcryptjs_1.default.compare(nuevaPassword, usuario.contrasena);
    if (esRepetida) {
        throw { status: 400, message: 'La nueva contraseña no puede ser igual a la anterior.' };
    }
    const hash = await bcryptjs_1.default.hash(nuevaPassword, 12);
    const conn = await database_1.pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query(`UPDATE usuario_rol SET contrasena = ? WHERE id_usuario = ?`, [hash, usuario.id_usuario]);
        await conn.commit();
    }
    catch (err) {
        await conn.rollback();
        throw { status: 500, message: 'Error al guardar la contraseña. Intente nuevamente.' };
    }
    finally {
        conn.release();
    }
    await historial_service_1.HistorialService.registrar({
        usuario_id: usuario.id_usuario,
        accion: 'RESET_PASSWORD',
        modulo: 'autenticacion',
        descripcion: 'Contraseña restablecida exitosamente',
    });
}
// -------------------------------------------------------
// Chequear si un JTI está revocado (usado en middleware)
// -------------------------------------------------------
async function estaRevocado(jti) {
    void jti;
    return false;
}
// -------------------------------------------------------
// REGISTRO — agrega esta función a tu auth.service.ts
// -------------------------------------------------------
async function registro(nombre, correo, password, ip, userAgent) {
    // Validar seguridad de la contraseña
    const passwordSegura = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);
    if (!passwordSegura) {
        throw {
            status: 400,
            message: 'Contraseña insegura. Debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.',
        };
    }
    const [existe] = await database_1.pool.query(`SELECT id_usuario FROM usuario_rol WHERE correo_electronico = ?`, [correo]);
    if (existe.length > 0) {
        throw { status: 409, message: 'El correo ya está registrado' };
    }
    const hash = await bcryptjs_1.default.hash(password, 12);
    const esBarbero = correo.endsWith('@brasilios.com');
    const rolNombre = esBarbero ? 'barbero' : 'cliente';
    const [nombres] = nombre.trim().split(/\s+/, 2);
    const apellido = nombre.trim().split(/\s+/).slice(1).join(' ') || 'Usuario';
    const [result] = await database_1.pool.query(`INSERT INTO usuario_rol (nombre, apellido, correo_electronico, contrasena, rol, estado)
     VALUES (?, ?, ?, ?, ?, 'activo')`, [nombres, apellido, correo, hash, rolNombre]);
    const usuarioId = result.insertId;
    // Registrar en historial
    await historial_service_1.HistorialService.registrar({
        usuario_id: usuarioId,
        accion: 'CREAR',
        modulo: 'autenticacion',
        descripcion: 'Registro de nuevo usuario',
        ip_address: ip,
        user_agent: userAgent,
    });
    const accessToken = (0, jwt_1.generarAccessToken)({ sub: usuarioId, rol: rolNombre, correo });
    const refreshToken = (0, jwt_1.generarRefreshToken)(usuarioId);
    return { accessToken, refreshToken, rol: rolNombre };
}
//# sourceMappingURL=auth.service.js.map