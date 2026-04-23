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
exports.listarMisNotificaciones = listarMisNotificaciones;
exports.marcarNotificacionLeida = marcarNotificacionLeida;
const notificaciones_service_1 = require("../services/notificaciones.service");
const R = __importStar(require("../utils/response"));
async function listarMisNotificaciones(req, res) {
    try {
        const data = await notificaciones_service_1.NotificacionesService.listarPorUsuario(req.usuario.id);
        R.ok(res, 'Notificaciones obtenidas', data);
    }
    catch (err) {
        R.serverError(res, err.message);
    }
}
async function marcarNotificacionLeida(req, res) {
    try {
        await notificaciones_service_1.NotificacionesService.marcarLeida(Number(req.params.id), req.usuario.id);
        R.ok(res, 'Notificación marcada como leída');
    }
    catch (err) {
        const status = err.status || 500;
        if (status === 404) {
            R.notFound(res, err.message);
            return;
        }
        R.serverError(res, err.message);
    }
}
//# sourceMappingURL=notificaciones.controller.js.map