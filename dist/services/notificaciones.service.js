"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificacionesService = void 0;
const database_1 = require("../config/database");
class NotificacionesService {
    static async crear(params) {
        void params;
    }
    static async listarPorUsuario(usuarioId) {
        const [rows] = await database_1.pool.query(`SELECT
          r.id_reserva,
          ? AS usuario_id,
          CASE r.estado
            WHEN 'pendiente' THEN 'RESERVA_PENDIENTE'
            WHEN 'confirmada' THEN 'RESERVA_CONFIRMADA'
            WHEN 'cancelada' THEN 'RESERVA_CANCELADA'
            ELSE 'RECORDATORIO_RESERVA'
          END AS tipo,
          CONCAT('Reserva #', r.id_reserva) AS titulo,
          CONCAT('Estado actual: ', r.estado) AS mensaje,
          r.recordatorio AS leida,
          DATE_FORMAT(r.fecha, '%Y-%m-%d') AS fecha,
          DATE_FORMAT(r.hora, '%H:%i:%s') AS hora
       FROM reserva r
       WHERE r.id_cliente = ?
       ORDER BY r.fecha DESC, r.hora DESC`, [usuarioId, usuarioId]);
        return rows;
    }
    static async marcarLeida(notificacionId, usuarioId) {
        const [result] = await database_1.pool.query(`UPDATE reserva SET recordatorio = 1 WHERE id_reserva = ? AND id_cliente = ?`, [notificacionId, usuarioId]);
        if (result.affectedRows === 0) {
            throw { status: 404, message: 'Notificación no encontrada' };
        }
    }
}
exports.NotificacionesService = NotificacionesService;
//# sourceMappingURL=notificaciones.service.js.map