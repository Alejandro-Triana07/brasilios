import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { Notificacion } from '../types';

interface CrearNotificacionParams {
  usuario_id: number;
  tipo: 'RESERVA_PENDIENTE' | 'RESERVA_CONFIRMADA' | 'RESERVA_CANCELADA' | 'RECORDATORIO_RESERVA';
  titulo: string;
  mensaje: string;
  referencia_id?: number;
}

export class NotificacionesService {
  static async crear(params: CrearNotificacionParams): Promise<void> {
    void params;
  }

  static async listarPorUsuario(usuarioId: number): Promise<Notificacion[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
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
       ORDER BY r.fecha DESC, r.hora DESC`,
      [usuarioId, usuarioId]
    );
    return rows as Notificacion[];
  }

  static async marcarLeida(notificacionId: number, usuarioId: number): Promise<void> {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE reserva SET recordatorio = 1 WHERE id_reserva = ? AND id_cliente = ?`,
      [notificacionId, usuarioId]
    );

    if (result.affectedRows === 0) {
      throw { status: 404, message: 'Notificación no encontrada' };
    }
  }
}
