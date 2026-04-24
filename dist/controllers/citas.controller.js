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
exports.listarCitas = listarCitas;
exports.obtenerCita = obtenerCita;
exports.crearCita = crearCita;
exports.validarDisponibilidad = validarDisponibilidad;
exports.listarBarberosDisponibles = listarBarberosDisponibles;
exports.modificarCita = modificarCita;
exports.cancelarCita = cancelarCita;
exports.ejecutarRecordatorios = ejecutarRecordatorios;
exports.eliminarCita = eliminarCita;
const citas_service_1 = require("../services/citas.service");
const R = __importStar(require("../utils/response"));
async function listarCitas(req, res) {
    try {
        const citas = await citas_service_1.CitasService.listarCitas(req.usuario.id, req.usuario.rol);
        R.ok(res, 'Citas obtenidas correctamente', citas);
    }
    catch (err) {
        R.serverError(res, err.message);
    }
}
async function obtenerCita(req, res) {
    try {
        const cita = await citas_service_1.CitasService.obtenerCitaPorId(Number(req.params.id), req.usuario.id, req.usuario.rol);
        R.ok(res, 'Cita obtenida correctamente', cita);
    }
    catch (err) {
        const status = err.status || 500;
        if (status === 404)
            R.notFound(res, err.message);
        else
            R.serverError(res, err.message);
    }
}
async function crearCita(req, res) {
    try {
        const { cliente_id, servicio_id, fecha, hora, barbero_id, observaciones } = req.body;
        if (req.usuario.rol === 'cliente' && req.usuario.id !== cliente_id) {
            R.forbidden(res, 'Un cliente solo puede registrar citas para su propia cuenta');
            return;
        }
        const result = await citas_service_1.CitasService.crearCita({
            cliente_id,
            servicio_id,
            fecha,
            hora,
            barbero_id,
            observaciones,
            creado_por: req.usuario.id,
        });
        R.created(res, 'Cita registrada correctamente', result);
    }
    catch (err) {
        const status = err.status || 500;
        if (status === 400)
            R.badRequest(res, err.message);
        else if (status === 403)
            R.forbidden(res, err.message);
        else if (status === 404)
            R.notFound(res, err.message);
        else if (status === 409)
            R.conflict(res, err.message);
        else
            R.serverError(res, err.message);
    }
}
async function validarDisponibilidad(req, res) {
    try {
        const { fecha, hora, servicio_id, barbero_id } = req.query;
        if (!barbero_id) {
            R.badRequest(res, 'Debe enviar barbero_id para validar disponibilidad');
            return;
        }
        const result = await citas_service_1.CitasService.validarDisponibilidad(String(fecha), String(hora), Number(servicio_id), Number(barbero_id));
        R.ok(res, 'Disponibilidad consultada', result);
    }
    catch (err) {
        const status = err.status || 500;
        if (status === 400)
            R.badRequest(res, err.message);
        else if (status === 404)
            R.notFound(res, err.message);
        else
            R.serverError(res, err.message);
    }
}
async function listarBarberosDisponibles(req, res) {
    try {
        const { fecha, hora, servicio_id } = req.query;
        const result = await citas_service_1.CitasService.listarBarberosDisponibles(String(fecha), String(hora), Number(servicio_id));
        R.ok(res, 'Barberos disponibles obtenidos', result);
    }
    catch (err) {
        const status = err.status || 500;
        if (status === 400)
            R.badRequest(res, err.message);
        else
            R.serverError(res, err.message);
    }
}
async function modificarCita(req, res) {
    try {
        const citaId = Number(req.params.id);
        await citas_service_1.CitasService.modificarCita(citaId, {
            ...req.body,
            actualizado_por: req.usuario.id,
            rol_usuario: req.usuario.rol,
        });
        R.ok(res, 'Cita modificada correctamente');
    }
    catch (err) {
        const status = err.status || 500;
        if (status === 400)
            R.badRequest(res, err.message);
        else if (status === 403)
            R.forbidden(res, err.message);
        else if (status === 404)
            R.notFound(res, err.message);
        else if (status === 409)
            R.conflict(res, err.message);
        else
            R.serverError(res, err.message);
    }
}
async function cancelarCita(req, res) {
    try {
        const citaId = Number(req.params.id);
        await citas_service_1.CitasService.cancelarCita(citaId, req.usuario.id, req.usuario.rol);
        R.ok(res, 'Cita cancelada correctamente');
    }
    catch (err) {
        const status = err.status || 500;
        if (status === 400)
            R.badRequest(res, err.message);
        else if (status === 403)
            R.forbidden(res, err.message);
        else if (status === 404)
            R.notFound(res, err.message);
        else
            R.serverError(res, err.message);
    }
}
async function ejecutarRecordatorios(req, res) {
    try {
        const result = await citas_service_1.CitasService.ejecutarRecordatoriosAutomaticos();
        R.ok(res, 'Recordatorios procesados', result);
    }
    catch (err) {
        R.serverError(res, err.message);
    }
}
async function eliminarCita(req, res) {
    try {
        await citas_service_1.CitasService.eliminarCita(Number(req.params.id), req.usuario.id, req.usuario.rol);
        R.ok(res, 'Cita eliminada correctamente');
    }
    catch (err) {
        const status = err.status || 500;
        if (status === 400)
            R.badRequest(res, err.message);
        else if (status === 404)
            R.notFound(res, err.message);
        else
            R.serverError(res, err.message);
    }
}
//# sourceMappingURL=citas.controller.js.map