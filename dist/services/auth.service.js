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
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
const historial_service_1 = require("./historial.service");
const email_1 = require("../utils/email");
const jwt_1 = require("../utils/jwt");
const MAX_INTENTOS = Number(process.env.MAX_LOGIN_ATTEMPTS) || 5;
const LOCK_MINUTES = Number(process.env.LOCK_TIME_MINUTES) || 15;
const CODE_EXPIRES = Number(process.env.RESET_CODE_EXPIRES_MINUTES) || 15;
// -------------------------------------------------------
// HU-1.1 / HU-1.2  Autenticación y verificación
// -------------------------------------------------------
async function login(correo, password, ip, userAgent) {
    const [rows] = await database_1.pool.query(`SELECT u.*, r.nombre AS rol_nombre
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE u.correo = ?`, [correo]);
    // Usuario no registrado
    if (rows.length === 0) {
        throw { status: 401, message: 'Usuario no registrado' };
    }
    const usuario = rows[0];
    // Cuenta inactiva
    if (!usuario.activo) {
        throw { status: 403, message: 'Cuenta inactiva. Contacte al administrador.' };
    }
    // Cuenta bloqueada
    if (usuario.bloqueado_hasta && new Date() < new Date(usuario.bloqueado_hasta)) {
        const minutos = Math.ceil((new Date(usuario.bloqueado_hasta).getTime() - Date.now()) / 60000);
        throw {
            status: 403,
            message: `Cuenta bloqueada. Intente en ${minutos} minuto(s).`,
        };
    }
    // Verificar contraseña
    const passwordCorrecta = await bcryptjs_1.default.compare(password, usuario.password_hash);
    if (!passwordCorrecta) {
        const nuevoIntentos = usuario.intentos_fallidos + 1;
        let bloqueadoHasta = null;
        if (nuevoIntentos >= MAX_INTENTOS) {
            const fecha = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
            bloqueadoHasta = fecha.toISOString().slice(0, 19).replace('T', ' ');
            await database_1.pool.query(`UPDATE usuarios SET intentos_fallidos = ?, bloqueado_hasta = ? WHERE id = ?`, [nuevoIntentos, bloqueadoHasta, usuario.id]);
            await historial_service_1.HistorialService.registrar({
                usuario_id: usuario.id,
                accion: 'BLOQUEO',
                modulo: 'autenticacion',
                descripcion: `Cuenta bloqueada por ${MAX_INTENTOS} intentos fallidos`,
                ip_address: ip,
                user_agent: userAgent,
            });
            throw { status: 403, message: `Cuenta bloqueada por ${LOCK_MINUTES} minutos.` };
        }
        await database_1.pool.query(`UPDATE usuarios SET intentos_fallidos = ? WHERE id = ?`, [nuevoIntentos, usuario.id]);
        throw {
            status: 401,
            message: `Contraseña incorrecta. Intentos restantes: ${MAX_INTENTOS - nuevoIntentos}`,
        };
    }
    // Login exitoso → resetear intentos
    await database_1.pool.query(`UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_login = NOW() WHERE id = ?`, [usuario.id]);
    const accessToken = (0, jwt_1.generarAccessToken)({ sub: usuario.id, rol: usuario.rol_nombre, correo: usuario.correo });
    const refreshToken = (0, jwt_1.generarRefreshToken)(usuario.id);
    await historial_service_1.HistorialService.registrar({
        usuario_id: usuario.id,
        accion: 'LOGIN',
        modulo: 'autenticacion',
        descripcion: 'Inicio de sesión exitoso',
        ip_address: ip,
        user_agent: userAgent,
    });
    return { accessToken, refreshToken, rol: usuario.rol_nombre };
}
// -------------------------------------------------------
// HU-1.6  Cierre de sesión seguro (blacklist del JTI)
// -------------------------------------------------------
async function logout(token, usuarioId, ip, userAgent) {
    const payload = (0, jwt_1.verificarAccessToken)(token);
    const expira = payload.exp
        ? new Date(payload.exp * 1000).toISOString().slice(0, 19).replace('T', ' ')
        : new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    await database_1.pool.query(`INSERT IGNORE INTO tokens_revocados (jti, usuario_id, expira_en) VALUES (?, ?, ?)`, [payload.jti, usuarioId, expira]);
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
    const [rows] = await database_1.pool.query(`SELECT id, nombre, activo FROM usuarios WHERE correo = ?`, [correo]);
    if (rows.length === 0) {
        throw { status: 404, message: 'Usuario no registrado' };
    }
    const usuario = rows[0];
    // Generar código numérico de 6 dígitos
    const codigo = crypto_1.default.randomInt(100000, 999999).toString();
    const expiraEn = new Date(Date.now() + CODE_EXPIRES * 60 * 1000)
        .toISOString().slice(0, 19).replace('T', ' ');
    // Invalidar códigos anteriores
    await database_1.pool.query(`UPDATE reset_tokens SET usado = 1 WHERE usuario_id = ? AND usado = 0`, [usuario.id]);
    await database_1.pool.query(`INSERT INTO reset_tokens (usuario_id, codigo, expira_en) VALUES (?, ?, ?)`, [usuario.id, codigo, expiraEn]);
    await (0, email_1.enviarCodigoRecuperacion)(correo, usuario.nombre, codigo);
}
// -------------------------------------------------------
// HU-1.4  Verificar código de recuperación
// -------------------------------------------------------
async function verificarCodigo(correo, codigo) {
    const [userRows] = await database_1.pool.query(`SELECT id FROM usuarios WHERE correo = ?`, [correo]);
    if (userRows.length === 0) {
        throw { status: 404, message: 'Usuario no registrado' };
    }
    const usuarioId = userRows[0].id;
    const [tokenRows] = await database_1.pool.query(`SELECT id, expira_en, usado
     FROM reset_tokens
     WHERE usuario_id = ? AND codigo = ?
     ORDER BY created_at DESC
     LIMIT 1`, [usuarioId, codigo]);
    if (tokenRows.length === 0) {
        throw { status: 400, message: 'Código incorrecto' };
    }
    const token = tokenRows[0];
    if (token.usado) {
        throw { status: 400, message: 'El código ya fue utilizado' };
    }
    if (new Date() > new Date(token.expira_en)) {
        throw { status: 400, message: 'El código ha expirado. Solicita uno nuevo.' };
    }
    return token.id;
}
// -------------------------------------------------------
// HU-1.5  Establecer nueva contraseña
// -------------------------------------------------------
async function resetearPassword(correo, codigo, nuevaPassword) {
    const tokenId = await verificarCodigo(correo, codigo);
    // Validar seguridad de la contraseña
    const passwordSegura = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(nuevaPassword);
    if (!passwordSegura) {
        throw {
            status: 400,
            message: 'Contraseña insegura. Debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.',
        };
    }
    const [userRows] = await database_1.pool.query(`SELECT id, password_hash FROM usuarios WHERE correo = ?`, [correo]);
    const usuario = userRows[0];
    // No permitir contraseña repetida
    const esRepetida = await bcryptjs_1.default.compare(nuevaPassword, usuario.password_hash);
    if (esRepetida) {
        throw { status: 400, message: 'La nueva contraseña no puede ser igual a la anterior.' };
    }
    const hash = await bcryptjs_1.default.hash(nuevaPassword, 12);
    const conn = await database_1.pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query(`UPDATE usuarios SET password_hash = ?, intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?`, [hash, usuario.id]);
        await conn.query(`UPDATE reset_tokens SET usado = 1 WHERE id = ?`, [tokenId]);
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
        usuario_id: usuario.id,
        accion: 'RESET_PASSWORD',
        modulo: 'autenticacion',
        descripcion: 'Contraseña restablecida exitosamente',
    });
}
// -------------------------------------------------------
// Chequear si un JTI está revocado (usado en middleware)
// -------------------------------------------------------
async function estaRevocado(jti) {
    const [rows] = await database_1.pool.query(`SELECT id FROM tokens_revocados WHERE jti = ?`, [jti]);
    return rows.length > 0;
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
    // Verificar si el correo ya existe
    const [existe] = await database_1.pool.query(`SELECT id FROM usuarios WHERE correo = ?`, [correo]);
    if (existe.length > 0) {
        throw { status: 409, message: 'El correo ya está registrado' };
    }
    // Encriptar contraseña
    const hash = await bcryptjs_1.default.hash(password, 12);
    // Obtener rol 'empleado' por defecto (id = 3)
    const esEmpleado = correo.endsWith('@brasilios.com');
    const rolNombre = esEmpleado ? 'empleado' : 'cliente';
    const [rolRows] = await database_1.pool.query(`SELECT id FROM roles WHERE nombre = ? LIMIT 1`, [rolNombre]);
    const rolId = rolRows.length > 0 ? rolRows[0].id : 3;
    // Insertar usuario
    const [result] = await database_1.pool.query(`INSERT INTO usuarios (nombre, correo, password_hash, rol_id) VALUES (?, ?, ?, ?)`, [nombre, correo, hash, rolId]);
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
    // Generar tokens
    const accessToken = (0, jwt_1.generarAccessToken)({ sub: usuarioId, rol: 'empleado', correo });
    const refreshToken = (0, jwt_1.generarRefreshToken)(usuarioId);
    return { accessToken, refreshToken, rol: rolNombre };
}
//# sourceMappingURL=auth.service.js.map