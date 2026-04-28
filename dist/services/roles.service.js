"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesService = void 0;
const database_1 = require("../config/database");
const historial_service_1 = require("./historial.service");
class RolesService {
    // Listar todos los roles con sus permisos
    static async listarRoles() {
        const permisos = await this.listarPermisos();
        const grupos = {
            admin: ['*'],
            barbero: ['citas:ver', 'citas:editar', 'clientes:ver', 'notificaciones:ver'],
            cliente: ['citas:crear', 'citas:ver', 'citas:cancelar', 'notificaciones:ver'],
        };
        return ['admin', 'barbero', 'cliente'].map((nombreRol) => ({
            id: nombreRol,
            nombre: nombreRol,
            descripcion: `Rol ${nombreRol}`,
            permisos: grupos[nombreRol].includes('*')
                ? permisos
                : permisos.filter((p) => grupos[nombreRol].includes(`${p.modulo}:${p.accion}`)),
        }));
    }
    // Actualizar permisos de un rol  (HU-1.7)
    static async actualizarPermisosRol(rolId, permisosIds, adminId, ip, userAgent) {
        void rolId;
        void permisosIds;
        await historial_service_1.HistorialService.registrar({
            usuario_id: adminId,
            accion: 'MODIFICAR',
            modulo: 'roles',
            descripcion: 'Solicitud de actualización de permisos (modo estático)',
            ip_address: ip,
            user_agent: userAgent,
            datos_despues: { permisos: permisosIds, nota: 'No persistente en DB v1.0' },
        });
    }
    // Asignar rol a un usuario  (HU-1.7)
    static async asignarRolUsuario(usuarioId, rolId, adminId, ip, userAgent) {
        const [userRows] = await database_1.pool.query(`SELECT id_usuario, nombre, rol FROM usuario_rol WHERE id_usuario = ?`, [usuarioId]);
        if (userRows.length === 0) {
            throw { status: 404, message: 'Usuario no registrado' };
        }
        const mapaRoles = {
            1: 'admin',
            2: 'barbero',
            3: 'cliente',
        };
        const rolNuevo = mapaRoles[rolId];
        if (!rolNuevo)
            throw { status: 404, message: 'Rol no encontrado' };
        const rolAnterior = String(userRows[0].rol);
        await database_1.pool.query(`UPDATE usuario_rol SET rol = ? WHERE id_usuario = ?`, [rolNuevo, usuarioId]);
        await historial_service_1.HistorialService.registrar({
            usuario_id: adminId,
            accion: 'MODIFICAR',
            modulo: 'roles',
            descripcion: `Rol del usuario "${userRows[0].nombre}" actualizado`,
            ip_address: ip,
            user_agent: userAgent,
            datos_antes: { rol: rolAnterior },
            datos_despues: { rol: rolNuevo },
        });
    }
    // Listar todos los permisos disponibles
    static async listarPermisos() {
        return [
            { id: 'citas_ver', modulo: 'citas', accion: 'ver', descripcion: 'Ver citas' },
            { id: 'citas_crear', modulo: 'citas', accion: 'crear', descripcion: 'Crear citas' },
            { id: 'citas_editar', modulo: 'citas', accion: 'editar', descripcion: 'Editar citas' },
            { id: 'citas_cancelar', modulo: 'citas', accion: 'cancelar', descripcion: 'Cancelar citas' },
            { id: 'clientes_ver', modulo: 'clientes', accion: 'ver', descripcion: 'Ver clientes' },
            { id: 'notificaciones_ver', modulo: 'notificaciones', accion: 'ver', descripcion: 'Ver notificaciones' },
        ];
    }
}
exports.RolesService = RolesService;
//# sourceMappingURL=roles.service.js.map