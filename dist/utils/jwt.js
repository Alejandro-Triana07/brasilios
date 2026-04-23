"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generarAccessToken = generarAccessToken;
exports.generarRefreshToken = generarRefreshToken;
exports.verificarAccessToken = verificarAccessToken;
exports.verificarRefreshToken = verificarRefreshToken;
exports.decodificarToken = decodificarToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
function generarAccessToken(payload) {
    const jti = (0, uuid_1.v4)();
    return jsonwebtoken_1.default.sign({ ...payload, jti }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
}
function generarRefreshToken(usuarioId) {
    return jsonwebtoken_1.default.sign({ sub: usuarioId, jti: (0, uuid_1.v4)() }, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
    });
}
function verificarAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, JWT_SECRET);
}
function verificarRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET);
}
function decodificarToken(token) {
    try {
        return jsonwebtoken_1.default.decode(token);
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=jwt.js.map