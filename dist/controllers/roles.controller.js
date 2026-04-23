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
exports.listarRoles = listarRoles;
exports.listarPermisos = listarPermisos;
exports.actualizarPermisosRol = actualizarPermisosRol;
exports.asignarRolUsuario = asignarRolUsuario;
const roles_service_1 = require("../services/roles.service");
const R = __importStar(require("../utils/response"));
// GET /roles
async function listarRoles(req, res) {
    try {
        const roles = await roles_service_1.RolesService.listarRoles();
        R.ok(res, 'Roles obtenidos', roles);
    }
    catch (err) {
        R.serverError(res, err.message);
    }
}
// GET /roles/permisos
async function listarPermisos(req, res) {
    try {
        const permisos = await roles_service_1.RolesService.listarPermisos();
        R.ok(res, 'Permisos obtenidos', permisos);
    }
    catch (err) {
        R.serverError(res, err.message);
    }
}
// PUT /roles/:id/permisos  — HU-1.7
async function actualizarPermisosRol(req, res) {
    try {
        const rolId = Number(req.params.id);
        const { permisos_ids } = req.body;
        const ip = req.ip || '';
        const userAgent = req.headers['user-agent'] || '';
        await roles_service_1.RolesService.actualizarPermisosRol(rolId, permisos_ids, req.usuario.id, ip, userAgent);
        R.ok(res, 'Permisos del rol actualizados exitosamente');
    }
    catch (err) {
        const status = err.status || 500;
        if (status === 404)
            R.notFound(res, err.message);
        else
            R.serverError(res, err.message);
    }
}
// PUT /roles/asignar  — HU-1.7
async function asignarRolUsuario(req, res) {
    try {
        const { usuario_id, rol_id } = req.body;
        const ip = req.ip || '';
        const userAgent = req.headers['user-agent'] || '';
        await roles_service_1.RolesService.asignarRolUsuario(usuario_id, rol_id, req.usuario.id, ip, userAgent);
        R.ok(res, 'Rol asignado exitosamente');
    }
    catch (err) {
        const status = err.status || 500;
        if (status === 404)
            R.notFound(res, err.message);
        else
            R.serverError(res, err.message);
    }
}
//# sourceMappingURL=roles.controller.js.map