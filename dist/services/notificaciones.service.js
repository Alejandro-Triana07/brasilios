"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificacionesService = void 0;
const database_1 = require("../config/database");
class NotificacionesService {
    static async crear(params) {
        await database_1.pool.query(`INSERT INTO notificaciones
        (usuario_id, tipo, titulo, mensaje, referencia_tipo, referencia_id)
       VALUES (?, ?, ?, ?, ?, ?)`, [
            params.usuario_id,
            params.tipo,
            params.titulo,
            params.mensaje,
            params.referencia_tipo ?? 'cita',
            params.referencia_id ?? null,
        ]);
    }
    static async listarPorUsuario(usuarioId) {
        const [rows] = await database_1.pool.query(`SELECT id, usuario_id, tipo, titulo, mensaje, referencia_tipo, referencia_id, leida, created_at
       FROM notificaciones
       WHERE usuario_id = ?
       ORDER BY created_at DESC`, [usuarioId]);
        return rows;
    }
    static async marcarLeida(notificacionId, usuarioId) {
        const [result] = await database_1.pool.query(`UPDATE notificaciones SET leida = 1 WHERE id = ? AND usuario_id = ?`, [notificacionId, usuarioId]);
        if (result.affectedRows === 0) {
            throw { status: 404, message: 'Notificación no encontrada' };
        }
    }
}
exports.NotificacionesService = NotificacionesService;
//# sourceMappingURL=notificaciones.service.js.map