"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistorialService = void 0;
const database_1 = require("../config/database");
class HistorialService {
    // Registrar una entrada en el historial
    static async registrar(params) {
        try {
            await database_1.pool.query(`INSERT INTO historial_cambios
          (usuario_id, accion, modulo, descripcion, ip_address, user_agent, datos_antes, datos_despues)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
                params.usuario_id ?? null,
                params.accion,
                params.modulo,
                params.descripcion ?? null,
                params.ip_address ?? null,
                params.user_agent ?? null,
                params.datos_antes ? JSON.stringify(params.datos_antes) : null,
                params.datos_despues ? JSON.stringify(params.datos_despues) : null,
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
            condiciones.push('h.created_at >= ?');
            params.push(filtros.fechaDesde);
        }
        if (filtros.fechaHasta) {
            condiciones.push('h.created_at <= ?');
            params.push(filtros.fechaHasta + ' 23:59:59');
        }
        if (filtros.usuarioId) {
            condiciones.push('h.usuario_id = ?');
            params.push(filtros.usuarioId);
        }
        if (filtros.modulo) {
            condiciones.push('h.modulo = ?');
            params.push(filtros.modulo);
        }
        if (filtros.accion) {
            condiciones.push('h.accion = ?');
            params.push(filtros.accion);
        }
        const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
        const [countRows] = await database_1.pool.query(`SELECT COUNT(*) AS total FROM historial_cambios h ${where}`, params);
        const total = countRows[0].total;
        const [rows] = await database_1.pool.query(`SELECT h.*, u.nombre AS usuario_nombre, u.correo AS usuario_correo
       FROM historial_cambios h
       LEFT JOIN usuarios u ON u.id = h.usuario_id
       ${where}
       ORDER BY h.created_at DESC
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