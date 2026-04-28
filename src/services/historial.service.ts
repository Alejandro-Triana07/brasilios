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
        `INSERT INTO reporte (id_usuario, tipo)
         VALUES (?, ?)`,
        [
          params.usuario_id ?? null,
          `${params.modulo}:${params.accion}`,
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

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM reporte h ${where}`,
      params
    );
    const total = (countRows[0].total as number);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT h.id_reporte, h.id_usuario, h.tipo, h.fecha_generacion,
              CONCAT(u.nombre, ' ', u.apellido) AS usuario_nombre,
              u.correo_electronico AS usuario_correo
       FROM reporte h
       LEFT JOIN usuario_rol u ON u.id_usuario = h.id_usuario
       ${where}
       ORDER BY h.fecha_generacion DESC
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
