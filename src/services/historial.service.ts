import { pool } from '../config/database';
import { AccionHistorial, FiltroHistorial, HistorialCambio } from '../types';
import { RowDataPacket } from 'mysql2';

interface RegistrarParams {
  usuario_id?:   number | null;
  accion:        AccionHistorial;
  modulo:        string;
  descripcion?:  string;
  ip_address?:   string;
  user_agent?:   string;
  datos_antes?:  Record<string, unknown>;
  datos_despues?: Record<string, unknown>;
}

export class HistorialService {

  // Registrar una entrada en el historial
  static async registrar(params: RegistrarParams): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO historial_cambios
          (usuario_id, accion, modulo, descripcion, ip_address, user_agent, datos_antes, datos_despues)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          params.usuario_id ?? null,
          params.accion,
          params.modulo,
          params.descripcion ?? null,
          params.ip_address ?? null,
          params.user_agent ?? null,
          params.datos_antes  ? JSON.stringify(params.datos_antes)  : null,
          params.datos_despues ? JSON.stringify(params.datos_despues) : null,
        ]
      );
    } catch (err) {
      // El historial nunca debe romper el flujo principal
      console.error('Error registrando historial:', err);
    }
  }

  // Listar historial con filtros y paginación  (HU-1.8)
  static async listar(filtros: FiltroHistorial): Promise<{
    registros: HistorialCambio[];
    total: number;
    pagina: number;
    totalPaginas: number;
  }> {
    const pagina = filtros.pagina  || 1;
    const limite = filtros.limite  || 20;
    const offset = (pagina - 1) * limite;

    const condiciones: string[] = [];
    const params: unknown[] = [];

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

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM historial_cambios h ${where}`,
      params
    );
    const total = (countRows[0].total as number);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT h.*, u.nombre AS usuario_nombre, u.correo AS usuario_correo
       FROM historial_cambios h
       LEFT JOIN usuarios u ON u.id = h.usuario_id
       ${where}
       ORDER BY h.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limite, offset]
    );

    return {
      registros:    rows as unknown as HistorialCambio[],
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
    };
  }
}
