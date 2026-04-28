"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.logout = logout;
exports.solicitarRecuperacion = solicitarRecuperacion;
exports.verificarCodigo = verificarCodigo;
exports.resetearPassword = resetearPassword;
exports.registro = registro;
const AuthService = __importStar(require("../services/auth.service"));
const R = __importStar(require("../utils/response"));
// HU-1.1 / HU-1.2 — Login
async function login(req, res) {
    try {
        const { correo, password } = req.body;
        const ip = req.ip || req.socket.remoteAddress || '';
        const userAgent = req.headers['user-agent'] || '';
        const result = await AuthService.login(correo, password, ip, userAgent);
        R.ok(res, 'Inicio de sesión exitoso', result);
    }
    catch (err) {
        const status = err.status || 500;
        if (status === 500)
            R.serverError(res, err.message);
        else if (status === 403)
            R.forbidden(res, err.message);
        else
            R.unauthorized(res, err.message);
    }
}
// HU-1.6 — Logout
async function logout(req, res) {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const ip = req.ip || '';
        const userAgent = req.headers['user-agent'] || '';
        await AuthService.logout(token, req.usuario.id, ip, userAgent);
        R.ok(res, 'Sesión cerrada exitosamente');
    }
    catch (err) {
        R.serverError(res, err.message);
    }
}
// HU-1.3 / HU-1.4 — Solicitar código de recuperación
async function solicitarRecuperacion(req, res) {
    try {
        const { correo } = req.body;
        await AuthService.solicitarRecuperacion(correo);
        R.ok(res, 'Código de verificación enviado al correo registrado');
    }
    catch (err) {
        const status = err.status || 500;
        if (status === 404)
            R.notFound(res, err.message);
        else if (status === 501)
            R.badRequest(res, err.message);
        else
            R.serverError(res, err.message);
    }
}
// HU-1.4 — Verificar código
async function verificarCodigo(req, res) {
    try {
        const { correo, codigo } = req.body;
        await AuthService.verificarCodigo(correo, codigo);
        R.ok(res, 'Código válido. Puede establecer una nueva contraseña.');
    }
    catch (err) {
        const status = err.status || 500;
        if (status === 404)
            R.notFound(res, err.message);
        else if (status === 501)
            R.badRequest(res, err.message);
        else if (status === 400)
            R.badRequest(res, err.message);
        else
            R.serverError(res, err.message);
    }
}
// HU-1.5 — Resetear contraseña
async function resetearPassword(req, res) {
    try {
        const { correo, codigo, nueva_password } = req.body;
        await AuthService.resetearPassword(correo, codigo, nueva_password);
        R.ok(res, 'Contraseña actualizada exitosamente');
    }
    catch (err) {
        const status = err.status || 500;
        if (status === 400)
            R.badRequest(res, err.message);
        else if (status === 501)
            R.badRequest(res, err.message);
        else if (status === 404)
            R.notFound(res, err.message);
        else
            R.serverError(res, err.message);
    }
}
// -------------------------------------------------------
// CONTROLLER — agrega esta función a tu auth.controller.ts
// -------------------------------------------------------
async function registro(req, res) {
    try {
        const { nombre, correo, password } = req.body;
        const ip = req.ip || req.socket.remoteAddress || '';
        const userAgent = req.headers['user-agent'] || '';
        const result = await AuthService.registro(nombre, correo, password, ip, userAgent);
        R.ok(res, 'Usuario registrado exitosamente', result);
    }
    catch (err) {
        const status = err.status || 500;
        if (status === 400)
            R.badRequest(res, err.message);
        else if (status === 409)
            R.conflict(res, err.message);
        else
            R.serverError(res, err.message);
    }
}
//# sourceMappingURL=auth.controller.js.map