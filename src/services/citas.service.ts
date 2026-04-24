import { pool } from '../config/database';
import { HistorialService } from './historial.service';
import { NotificacionesService } from './notificaciones.service';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { EstadoCita } from '../types';

interface CrearCitaInput {
  cliente_id: number;
  servicio_id: number;
  fecha: string;
  hora: string;
  barbero_id?: number;
  observaciones?: string;
  creado_por: number;
}

interface ModificarCitaInput {
  fecha?: string;
  hora?: string;
  servicio_id?: number;
  barbero_id?: number;
  observaciones?: string;
  actualizado_por: number;
  rol_usuario: string;
}

const APPOINTMENT_START_HOUR = process.env.APPOINTMENT_START_HOUR ?? '08:00';
const APPOINTMENT_END_HOUR = process.env.APPOINTMENT_END_HOUR ?? '20:00';
const REMINDER_MINUTES = Number(process.env.REMINDER_MINUTES ?? '120');

function parseMinutes(time: string): number {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

function addMinutes(time: string, minutesToAdd: number): string {
  const [hour, minute] = time.split(':').map(Number);
  const date = new Date(2000, 0, 1, hour, minute, 0, 0);
  date.setMinutes(date.getMinutes() + minutesToAdd);
  return date.toTimeString().slice(0, 8);
}

function ensureFutureDateTime(fecha: string, hora: string): void {
  const requested = new Date(`${fecha}T${hora}:00`);
  if (Number.isNaN(requested.getTime())) {
    throw { status: 400, message: 'Fecha u hora inválidas' };
  }
  if (requested.getTime() <= Date.now()) {
    throw { status: 400, message: 'No puedes registrar o mover citas al pasado' };
  }
}

export class CitasService {
  static async listarCitas(usuarioId: number, rolUsuario: string): Promise<RowDataPacket[]> {
    const esAdmin = ['administrador', 'dueña', 'empleado'].includes(rolUsuario);
    const where = esAdmin ? '' : 'WHERE c.cliente_id = ?';
    const params = esAdmin ? [] : [usuarioId];

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.id, c.fecha, c.hora_inicio, c.hora_fin, c.estado, c.observaciones, c.created_at,
              cli.id AS cliente_id, cli.nombre AS cliente_nombre,
              b.id AS barbero_id, b.nombre AS barbero_nombre,
              s.id AS servicio_id, s.nombre AS servicio_nombre, s.duracion AS servicio_duracion
       FROM citas c
       JOIN usuarios cli ON cli.id = c.cliente_id
       JOIN usuarios b ON b.id = c.barbero_id
       JOIN servicios s ON s.id = c.servicio_id
       ${where}
       ORDER BY c.fecha DESC, c.hora_inicio DESC`,
      params
    );

    return rows;
  }

  static async obtenerCitaPorId(citaId: number, usuarioId: number, rolUsuario: string): Promise<RowDataPacket> {
    const esAdmin = ['administrador', 'dueña', 'empleado'].includes(rolUsuario);
    const where = esAdmin ? 'c.id = ?' : 'c.id = ? AND c.cliente_id = ?';
    const params = esAdmin ? [citaId] : [citaId, usuarioId];

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.id, c.fecha, c.hora_inicio, c.hora_fin, c.estado, c.observaciones, c.created_at,
              cli.id AS cliente_id, cli.nombre AS cliente_nombre,
              b.id AS barbero_id, b.nombre AS barbero_nombre,
              s.id AS servicio_id, s.nombre AS servicio_nombre, s.duracion AS servicio_duracion
       FROM citas c
       JOIN usuarios cli ON cli.id = c.cliente_id
       JOIN usuarios b ON b.id = c.barbero_id
       JOIN servicios s ON s.id = c.servicio_id
       WHERE ${where}
       LIMIT 1`,
      params
    );

    if (rows.length === 0) {
      throw { status: 404, message: 'Cita no encontrada' };
    }

    return rows[0];
  }

  static async validarDisponibilidad(
    fecha: string,
    hora: string,
    servicioId: number,
    barberoId: number,
    citaExcluirId?: number
  ): Promise<{ disponible: boolean; mensaje: string; hora_fin: string }> {
    ensureFutureDateTime(fecha, hora);

    const [servicioRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, duracion FROM servicios WHERE id = ? AND activo = 1`,
      [servicioId]
    );
    if (servicioRows.length === 0) {
      throw { status: 404, message: 'Servicio no encontrado o inactivo' };
    }

    const [barberoRows] = await pool.query<RowDataPacket[]>(
      `SELECT u.id
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       WHERE u.id = ? AND u.activo = 1 AND r.nombre IN ('empleado', 'barbero', 'administrador', 'dueña')`,
      [barberoId]
    );
    if (barberoRows.length === 0) {
      throw { status: 404, message: 'Barbero no encontrado o inactivo' };
    }

    const duracion = Number(servicioRows[0].duracion);
    const horaFin = addMinutes(hora, duracion);
    const startMinutes = parseMinutes(hora);
    const endMinutes = parseMinutes(horaFin.slice(0, 5));

    const jornadaInicio = parseMinutes(APPOINTMENT_START_HOUR);
    const jornadaFin = parseMinutes(APPOINTMENT_END_HOUR);
    if (startMinutes < jornadaInicio || endMinutes > jornadaFin) {
      return {
        disponible: false,
        mensaje: `Horario fuera de jornada (${APPOINTMENT_START_HOUR} - ${APPOINTMENT_END_HOUR})`,
        hora_fin: horaFin,
      };
    }

    const query = `
      SELECT id
      FROM citas
      WHERE barbero_id = ?
        AND fecha = ?
        AND estado IN ('pendiente', 'confirmada')
        AND (? < hora_fin AND ? > hora_inicio)
        ${citaExcluirId ? 'AND id <> ?' : ''}
      LIMIT 1
    `;
    const params: Array<number | string> = [barberoId, fecha, hora, horaFin];
    if (citaExcluirId) {
      params.push(citaExcluirId);
    }

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    if (rows.length > 0) {
      return {
        disponible: false,
        mensaje: 'Horario no disponible para el barbero seleccionado',
        hora_fin: horaFin,
      };
    }

    return {
      disponible: true,
      mensaje: 'Horario disponible',
      hora_fin: horaFin,
    };
  }

  static async listarBarberosDisponibles(
    fecha: string,
    hora: string,
    servicioId: number
  ): Promise<Array<{ id: number; nombre: string; correo: string }>> {
    ensureFutureDateTime(fecha, hora);

    const [barberos] = await pool.query<RowDataPacket[]>(
      `SELECT u.id, u.nombre, u.correo
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       WHERE u.activo = 1 AND r.nombre IN ('empleado', 'barbero')
       ORDER BY u.nombre ASC`
    );

    const disponibles: Array<{ id: number; nombre: string; correo: string }> = [];

    for (const barbero of barberos) {
      const disponibilidad = await this.validarDisponibilidad(
        fecha,
        hora,
        servicioId,
        Number(barbero.id)
      );
      if (disponibilidad.disponible) {
        disponibles.push({
          id: Number(barbero.id),
          nombre: barbero.nombre as string,
          correo: barbero.correo as string,
        });
      }
    }

    return disponibles;
  }

  static async crearCita(input: CrearCitaInput): Promise<{ id: number; mensaje: string; barbero_asignado: number }> {
    const [clienteRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM usuarios WHERE id = ? AND activo = 1`,
      [input.cliente_id]
    );
    if (clienteRows.length === 0) {
      throw { status: 404, message: 'Cliente no encontrado o inactivo' };
    }

    let barberoId = input.barbero_id;
    if (!barberoId) {
      const disponibles = await this.listarBarberosDisponibles(input.fecha, input.hora, input.servicio_id);
      if (disponibles.length === 0) {
        throw { status: 409, message: 'No hay barberos disponibles en ese horario' };
      }
      barberoId = disponibles[0].id;
    }

    const disponibilidad = await this.validarDisponibilidad(
      input.fecha,
      input.hora,
      input.servicio_id,
      barberoId
    );
    if (!disponibilidad.disponible) {
      throw { status: 409, message: disponibilidad.mensaje };
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO citas
        (cliente_id, barbero_id, servicio_id, fecha, hora_inicio, hora_fin, estado, observaciones, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, 'pendiente', ?, ?)`,
      [
        input.cliente_id,
        barberoId,
        input.servicio_id,
        input.fecha,
        input.hora,
        disponibilidad.hora_fin,
        input.observaciones ?? null,
        input.creado_por,
      ]
    );

    await HistorialService.registrar({
      usuario_id: input.creado_por,
      accion: 'CREAR',
      modulo: 'citas',
      descripcion: `Cita #${result.insertId} creada`,
      datos_despues: {
        cita_id: result.insertId,
        cliente_id: input.cliente_id,
        barbero_id: barberoId,
        fecha: input.fecha,
        hora: input.hora,
      },
    });

    return {
      id: result.insertId,
      mensaje: 'Cita registrada correctamente',
      barbero_asignado: barberoId,
    };
  }

  static async modificarCita(citaId: number, input: ModificarCitaInput): Promise<void> {
    const [citaRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM citas WHERE id = ?`,
      [citaId]
    );
    if (citaRows.length === 0) {
      throw { status: 404, message: 'Cita no encontrada' };
    }

    const cita = citaRows[0];
    const esAdmin = ['administrador', 'dueña'].includes(input.rol_usuario);
    if (!esAdmin && Number(cita.cliente_id) !== input.actualizado_por) {
      throw { status: 403, message: 'No tienes permisos para modificar esta cita' };
    }

    if (cita.estado === 'cancelada' || cita.estado === 'atendida') {
      throw { status: 400, message: 'No se puede modificar una cita cancelada o atendida' };
    }

    const fechaNueva = (input.fecha ?? cita.fecha).toString().slice(0, 10);
    const horaNueva = (input.hora ?? cita.hora_inicio).toString().slice(0, 5);
    const servicioNuevo = Number(input.servicio_id ?? cita.servicio_id);
    const barberoNuevo = Number(input.barbero_id ?? cita.barbero_id);

    ensureFutureDateTime(fechaNueva, horaNueva);

    const disponibilidad = await this.validarDisponibilidad(
      fechaNueva,
      horaNueva,
      servicioNuevo,
      barberoNuevo,
      citaId
    );

    if (!disponibilidad.disponible) {
      throw { status: 409, message: disponibilidad.mensaje };
    }

    await pool.query(
      `UPDATE citas
       SET fecha = ?, hora_inicio = ?, hora_fin = ?, servicio_id = ?, barbero_id = ?, observaciones = ?
       WHERE id = ?`,
      [
        fechaNueva,
        horaNueva,
        disponibilidad.hora_fin,
        servicioNuevo,
        barberoNuevo,
        input.observaciones ?? cita.observaciones ?? null,
        citaId,
      ]
    );

    await HistorialService.registrar({
      usuario_id: input.actualizado_por,
      accion: 'MODIFICAR',
      modulo: 'citas',
      descripcion: `Cita #${citaId} modificada`,
      datos_antes: {
        fecha: cita.fecha,
        hora_inicio: cita.hora_inicio,
        servicio_id: cita.servicio_id,
        barbero_id: cita.barbero_id,
      },
      datos_despues: {
        fecha: fechaNueva,
        hora_inicio: horaNueva,
        servicio_id: servicioNuevo,
        barbero_id: barberoNuevo,
      },
    });

    await this.notificarCambioCita(citaId, 'CITA_MODIFICADA', barberoNuevo);
  }

  static async cancelarCita(
    citaId: number,
    usuarioSolicitanteId: number,
    rolUsuario: string,
    estadoFinal: EstadoCita = 'cancelada'
  ): Promise<void> {
    const [citaRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, cliente_id, barbero_id, estado FROM citas WHERE id = ?`,
      [citaId]
    );
    if (citaRows.length === 0) {
      throw { status: 404, message: 'Cita no encontrada' };
    }

    const cita = citaRows[0];
    const esAdmin = ['administrador', 'dueña'].includes(rolUsuario);
    if (!esAdmin && Number(cita.cliente_id) !== usuarioSolicitanteId) {
      throw { status: 403, message: 'No tienes permisos para cancelar esta cita' };
    }

    if (cita.estado === 'atendida') {
      throw { status: 400, message: 'No se puede cancelar una cita ya atendida' };
    }
    if (cita.estado === 'cancelada') {
      throw { status: 400, message: 'La cita ya se encuentra cancelada' };
    }

    await pool.query(
      `UPDATE citas SET estado = ? WHERE id = ?`,
      [estadoFinal, citaId]
    );

    await HistorialService.registrar({
      usuario_id: usuarioSolicitanteId,
      accion: 'MODIFICAR',
      modulo: 'citas',
      descripcion: `Cita #${citaId} cancelada`,
      datos_despues: { estado: 'cancelada' },
    });

    await this.notificarCambioCita(citaId, 'CITA_CANCELADA', Number(cita.barbero_id));
  }

  static async eliminarCita(citaId: number, usuarioSolicitanteId: number, rolUsuario: string): Promise<void> {
    const cita = await this.obtenerCitaPorId(citaId, usuarioSolicitanteId, rolUsuario);
    if (cita.estado === 'atendida') {
      throw { status: 400, message: 'No se puede eliminar una cita atendida' };
    }

    await pool.query(`DELETE FROM citas WHERE id = ?`, [citaId]);

    await HistorialService.registrar({
      usuario_id: usuarioSolicitanteId,
      accion: 'ELIMINAR',
      modulo: 'citas',
      descripcion: `Cita #${citaId} eliminada`,
      datos_antes: { cita_id: citaId, estado: cita.estado },
    });
  }

  private static async notificarCambioCita(
    citaId: number,
    tipo: 'CITA_MODIFICADA' | 'CITA_CANCELADA',
    barberoId: number
  ): Promise<void> {
    const [admins] = await pool.query<RowDataPacket[]>(
      `SELECT u.id
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       WHERE u.activo = 1 AND r.nombre IN ('administrador', 'dueña')`
    );

    const destinatarios = new Set<number>([barberoId, ...admins.map((row) => Number(row.id))]);
    const titulo = tipo === 'CITA_MODIFICADA' ? 'Cita modificada' : 'Cita cancelada';
    const mensaje = `La cita #${citaId} fue ${tipo === 'CITA_MODIFICADA' ? 'modificada' : 'cancelada'}.`;

    for (const usuarioId of destinatarios) {
      await NotificacionesService.crear({
        usuario_id: usuarioId,
        tipo,
        titulo,
        mensaje,
        referencia_id: citaId,
      });
    }
  }

  static async ejecutarRecordatoriosAutomaticos(): Promise<{ procesadas: number }> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.id, c.cliente_id, c.fecha, c.hora_inicio, u.nombre
       FROM citas c
       JOIN usuarios u ON u.id = c.cliente_id
       WHERE c.estado IN ('pendiente', 'confirmada')
         AND TIMESTAMP(c.fecha, c.hora_inicio) BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? MINUTE)
         AND NOT EXISTS (
           SELECT 1
           FROM cita_recordatorios cr
           WHERE cr.cita_id = c.id
         )`,
      [REMINDER_MINUTES]
    );

    for (const cita of rows) {
      await NotificacionesService.crear({
        usuario_id: Number(cita.cliente_id),
        tipo: 'RECORDATORIO_CITA',
        titulo: 'Recordatorio de cita',
        mensaje: `Tienes una cita el ${String(cita.fecha).slice(0, 10)} a las ${String(cita.hora_inicio).slice(0, 5)}.`,
        referencia_id: Number(cita.id),
      });

      await pool.query(
        `INSERT INTO cita_recordatorios (cita_id, enviado_en) VALUES (?, NOW())`,
        [cita.id]
      );
    }

    return { procesadas: rows.length };
  }
}
