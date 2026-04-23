import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { Notificacion } from '../types';

interface CrearNotificacionParams {
  usuario_id: number;
  tipo: 'CITA_MODIFICADA' | 'CITA_CANCELADA' | 'RECORDATORIO_CITA';
  titulo: string;
  mensaje: string;
  referencia_tipo?: string;
  referencia_id?: number;
}

export class NotificacionesService {
  static async crear(params: CrearNotificacionParams): Promise<void> {
    await pool.query<ResultSetHeader>(
      `INSERT INTO notificaciones
        (usuario_id, tipo, titulo, mensaje, referencia_tipo, referencia_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        params.usuario_id,
        params.tipo,
        params.titulo,
        params.mensaje,
        params.referencia_tipo ?? 'cita',
        params.referencia_id ?? null,
      ]
    );
  }

  static async listarPorUsuario(usuarioId: number): Promise<Notificacion[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, usuario_id, tipo, titulo, mensaje, referencia_tipo, referencia_id, leida, created_at
       FROM notificaciones
       WHERE usuario_id = ?
       ORDER BY created_at DESC`,
      [usuarioId]
    );
    return rows as Notificacion[];
  }

  static async marcarLeida(notificacionId: number, usuarioId: number): Promise<void> {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE notificaciones SET leida = 1 WHERE id = ? AND usuario_id = ?`,
      [notificacionId, usuarioId]
    );

    if (result.affectedRows === 0) {
      throw { status: 404, message: 'Notificación no encontrada' };
    }
  }
}
