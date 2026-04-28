"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistorialService = void 0;
const database_1 = require("../config/database");
class HistorialService {
    // Registrar una entrada en el historial
    static async registrar(params) {
        try {
            await database_1.pool.query(`INSERT INTO reporte (id_usuario, tipo)
         VALUES (?, ?)`, [
                params.usuario_id ?? null,
                `${params.modulo}:${params.accion}`,
            ]);
        }
        catch (err) {
            // El historial nunca debe romper el flujo principal
            console.error('Error registrando historial:', err);
        }
    }
    // Listar historial con filtros y paginación  (HU-1.8)
    static async listar(filtros) {
        const pagina = filtros.pagina || 1;
        const limite = filtros.limite || 20;
        const offset = (pagina - 1) * limite;
        const condiciones = [];
        const params = [];
        if (filtros.fechaDesde) {
            condiciones.push('h.fecha_generacion >= ?');
            params.push(filtros.fechaDesde);
        }
        if (filtros.fechaHasta) {
            condiciones.push('h.fecha_generacion <= ?');
            params.push(filtros.fechaHasta + ' 23:59:59');
        }
        if (filtros.usuarioId) {
            condiciones.push('h.id_usuario = ?');
            params.push(filtros.usuarioId);
        }
        if (filtros.modulo) {
            condiciones.push('h.tipo LIKE ?');
            params.push(`${filtros.modulo}:%`);
        }
        if (filtros.accion) {
            condiciones.push('h.tipo LIKE ?');
            params.push(`%:${filtros.accion}`);
        }
        const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
        const [countRows] = await database_1.pool.query(`SELECT COUNT(*) AS total FROM reporte h ${where}`, params);
        const total = countRows[0].total;
        const [rows] = await database_1.pool.query(`SELECT h.id_reporte, h.id_usuario, h.tipo, h.fecha_generacion,
              CONCAT(u.nombre, ' ', u.apellido) AS usuario_nombre,
              u.correo_electronico AS usuario_correo
       FROM reporte h
       LEFT JOIN usuario_rol u ON u.id_usuario = h.id_usuario
       ${where}
       ORDER BY h.fecha_generacion DESC
       LIMIT ? OFFSET ?`, [...params, limite, offset]);
        return {
            registros: rows,
            total,
            pagina,
            totalPaginas: Math.ceil(total / limite),
        };
    }
}
exports.HistorialService = HistorialService;
//# sourceMappingURL=historial.service.js.map