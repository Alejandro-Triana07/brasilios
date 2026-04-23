import { pool } from '../config/database';
import { HistorialService } from './historial.service';
import { Permiso, Rol } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class RolesService {

  // Listar todos los roles con sus permisos
  static async listarRoles(): Promise<(Rol & { permisos: Permiso[] })[]> {
    const [roles] = await pool.query<RowDataPacket[]>(
      `SELECT id, nombre, descripcion FROM roles ORDER BY id`
    );

    const result: (Rol & { permisos: Permiso[] })[] = [];

    for (const rol of roles) {
      const [permisos] = await pool.query<RowDataPacket[]>(
        `SELECT p.id, p.modulo, p.accion, p.descripcion
         FROM permisos p
         JOIN rol_permisos rp ON rp.permiso_id = p.id
         WHERE rp.rol_id = ?`,
        [rol.id]
      );
      result.push({ ...(rol as Rol), permisos: permisos as Permiso[] });
    }
    return result;
  }

  // Actualizar permisos de un rol  (HU-1.7)
  static async actualizarPermisosRol(
    rolId: number,
    permisosIds: number[],
    adminId: number,
    ip: string,
    userAgent: string
  ): Promise<void> {
    // Verificar que el rol exista
    const [rolRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, nombre FROM roles WHERE id = ?`,
      [rolId]
    );

    if (rolRows.length === 0) {
      throw { status: 404, message: 'Rol no encontrado' };
    }

    // Obtener permisos anteriores para auditoría
    const [permisosAnteriores] = await pool.query<RowDataPacket[]>(
      `SELECT permiso_id FROM rol_permisos WHERE rol_id = ?`,
      [rolId]
    );

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Eliminar permisos actuales
      await conn.query(`DELETE FROM rol_permisos WHERE rol_id = ?`, [rolId]);

      // Insertar nuevos permisos
      if (permisosIds.length > 0) {
        const values = permisosIds.map(pid => [rolId, pid]);
        await conn.query(
          `INSERT INTO rol_permisos (rol_id, permiso_id) VALUES ?`,
          [values]
        );
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw { status: 500, message: 'Error actualizando permisos del rol' };
    } finally {
      conn.release();
    }

    await HistorialService.registrar({
      usuario_id:   adminId,
      accion:       'MODIFICAR',
      modulo:       'roles',
      descripcion:  `Permisos del rol "${rolRows[0].nombre}" actualizados`,
      ip_address:   ip,
      user_agent:   userAgent,
      datos_antes:  { permisos: permisosAnteriores.map(p => p.permiso_id) },
      datos_despues: { permisos: permisosIds },
    });
  }

  // Asignar rol a un usuario  (HU-1.7)
  static async asignarRolUsuario(
    usuarioId: number,
    rolId: number,
    adminId: number,
    ip: string,
    userAgent: string
  ): Promise<void> {
    const [userRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, nombre, rol_id FROM usuarios WHERE id = ?`,
      [usuarioId]
    );

    if (userRows.length === 0) {
      throw { status: 404, message: 'Usuario no registrado' };
    }

    const [rolRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM roles WHERE id = ?`,
      [rolId]
    );

    if (rolRows.length === 0) {
      throw { status: 404, message: 'Rol no encontrado' };
    }

    const rolAnterior = userRows[0].rol_id as number;

    await pool.query(
      `UPDATE usuarios SET rol_id = ? WHERE id = ?`,
      [rolId, usuarioId]
    );

    await HistorialService.registrar({
      usuario_id:   adminId,
      accion:       'MODIFICAR',
      modulo:       'roles',
      descripcion:  `Rol del usuario "${userRows[0].nombre}" actualizado`,
      ip_address:   ip,
      user_agent:   userAgent,
      datos_antes:  { rol_id: rolAnterior },
      datos_despues: { rol_id: rolId },
    });
  }

  // Listar todos los permisos disponibles
  static async listarPermisos(): Promise<Permiso[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, modulo, accion, descripcion FROM permisos ORDER BY modulo, accion`
    );
    return rows as Permiso[];
  }
}
