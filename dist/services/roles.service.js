"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesService = void 0;
const database_1 = require("../config/database");
const historial_service_1 = require("./historial.service");
class RolesService {
    // Listar todos los roles con sus permisos
    static async listarRoles() {
        const [roles] = await database_1.pool.query(`SELECT id, nombre, descripcion FROM roles ORDER BY id`);
        const result = [];
        for (const rol of roles) {
            const [permisos] = await database_1.pool.query(`SELECT p.id, p.modulo, p.accion, p.descripcion
         FROM permisos p
         JOIN rol_permisos rp ON rp.permiso_id = p.id
         WHERE rp.rol_id = ?`, [rol.id]);
            result.push({ ...rol, permisos: permisos });
        }
        return result;
    }
    // Actualizar permisos de un rol  (HU-1.7)
    static async actualizarPermisosRol(rolId, permisosIds, adminId, ip, userAgent) {
        // Verificar que el rol exista
        const [rolRows] = await database_1.pool.query(`SELECT id, nombre FROM roles WHERE id = ?`, [rolId]);
        if (rolRows.length === 0) {
            throw { status: 404, message: 'Rol no encontrado' };
        }
        // Obtener permisos anteriores para auditoría
        const [permisosAnteriores] = await database_1.pool.query(`SELECT permiso_id FROM rol_permisos WHERE rol_id = ?`, [rolId]);
        const conn = await database_1.pool.getConnection();
        try {
            await conn.beginTransaction();
            // Eliminar permisos actuales
            await conn.query(`DELETE FROM rol_permisos WHERE rol_id = ?`, [rolId]);
            // Insertar nuevos permisos
            if (permisosIds.length > 0) {
                const values = permisosIds.map(pid => [rolId, pid]);
                await conn.query(`INSERT INTO rol_permisos (rol_id, permiso_id) VALUES ?`, [values]);
            }
            await conn.commit();
        }
        catch (err) {
            await conn.rollback();
            throw { status: 500, message: 'Error actualizando permisos del rol' };
        }
        finally {
            conn.release();
        }
        await historial_service_1.HistorialService.registrar({
            usuario_id: adminId,
            accion: 'MODIFICAR',
            modulo: 'roles',
            descripcion: `Permisos del rol "${rolRows[0].nombre}" actualizados`,
            ip_address: ip,
            user_agent: userAgent,
            datos_antes: { permisos: permisosAnteriores.map(p => p.permiso_id) },
            datos_despues: { permisos: permisosIds },
        });
    }
    // Asignar rol a un usuario  (HU-1.7)
    static async asignarRolUsuario(usuarioId, rolId, adminId, ip, userAgent) {
        const [userRows] = await database_1.pool.query(`SELECT id, nombre, rol_id FROM usuarios WHERE id = ?`, [usuarioId]);
        if (userRows.length === 0) {
            throw { status: 404, message: 'Usuario no registrado' };
        }
        const [rolRows] = await database_1.pool.query(`SELECT id FROM roles WHERE id = ?`, [rolId]);
        if (rolRows.length === 0) {
            throw { status: 404, message: 'Rol no encontrado' };
        }
        const rolAnterior = userRows[0].rol_id;
        await database_1.pool.query(`UPDATE usuarios SET rol_id = ? WHERE id = ?`, [rolId, usuarioId]);
        await historial_service_1.HistorialService.registrar({
            usuario_id: adminId,
            accion: 'MODIFICAR',
            modulo: 'roles',
            descripcion: `Rol del usuario "${userRows[0].nombre}" actualizado`,
            ip_address: ip,
            user_agent: userAgent,
            datos_antes: { rol_id: rolAnterior },
            datos_despues: { rol_id: rolId },
        });
    }
    // Listar todos los permisos disponibles
    static async listarPermisos() {
        const [rows] = await database_1.pool.query(`SELECT id, modulo, accion, descripcion FROM permisos ORDER BY modulo, accion`);
        return rows;
    }
}
exports.RolesService = RolesService;
//# sourceMappingURL=roles.service.js.map