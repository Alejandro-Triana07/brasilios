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
exports.crearCliente = crearCliente;
exports.listarClientes = listarClientes;
exports.obtenerCliente = obtenerCliente;
exports.actualizarCliente = actualizarCliente;
exports.eliminarCliente = eliminarCliente;
exports.historialServiciosCliente = historialServiciosCliente;
const R = __importStar(require("../utils/response"));
const clientes_service_1 = require("../services/clientes.service");
async function crearCliente(req, res) {
    try {
        const { nombre, telefono, correo } = req.body;
        const result = await clientes_service_1.ClientesService.crearCliente({
            nombre,
            telefono,
            correo,
            adminId: req.usuario.id,
        });
        R.created(res, 'Cliente registrado correctamente', result);
    }
    catch (err) {
        const status = err.status || 500;
        if (status === 409)
            R.conflict(res, err.message);
        else if (status === 400)
            R.badRequest(res, err.message);
        else
            R.serverError(res, err.message);
    }
}
async function listarClientes(req, res) {
    try {
        const filtro = req.query.filtro ? String(req.query.filtro) : undefined;
        const rows = await clientes_service_1.ClientesService.listarClientes(filtro);
        if (rows.length === 0) {
            R.ok(res, 'No se encontraron clientes con ese criterio', []);
            return;
        }
        R.ok(res, 'Clientes obtenidos correctamente', rows);
    }
    catch (err) {
        R.serverError(res, err.message);
    }
}
async function obtenerCliente(req, res) {
    try {
        const row = await clientes_service_1.ClientesService.obtenerClientePorId(Number(req.params.id));
        R.ok(res, 'Cliente obtenido correctamente', row);
    }
    catch (err) {
        const status = err.status || 500;
        if (status === 404)
            R.notFound(res, err.message);
        else
            R.serverError(res, err.message);
    }
}
async function actualizarCliente(req, res) {
    try {
        await clientes_service_1.ClientesService.actualizarCliente(Number(req.params.id), {
            ...req.body,
            adminId: req.usuario.id,
        });
        R.ok(res, 'Cliente actualizado correctamente');
    }
    catch (err) {
        const status = err.status || 500;
        if (status === 404)
            R.notFound(res, err.message);
        else if (status === 409)
            R.conflict(res, err.message);
        else
            R.serverError(res, err.message);
    }
}
async function eliminarCliente(req, res) {
    try {
        await clientes_service_1.ClientesService.eliminarCliente(Number(req.params.id), req.usuario.id);
        R.ok(res, 'Cliente eliminado correctamente');
    }
    catch (err) {
        const status = err.status || 500;
        if (status === 404)
            R.notFound(res, err.message);
        else
            R.serverError(res, err.message);
    }
}
async function historialServiciosCliente(req, res) {
    try {
        const rows = await clientes_service_1.ClientesService.historialServiciosCliente(Number(req.params.id));
        if (rows.length === 0) {
            R.ok(res, 'El cliente no tiene historial de servicios', []);
            return;
        }
        R.ok(res, 'Historial de servicios obtenido', rows);
    }
    catch (err) {
        const status = err.status || 500;
        if (status === 404)
            R.notFound(res, err.message);
        else
            R.serverError(res, err.message);
    }
}
//# sourceMappingURL=clientes.controller.js.map