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
  creado_por: number;
}

interface ModificarCitaInput {
  fecha?: string;
  hora?: string;
  servicio_id?: number;
  barbero_id?: number;
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
    const esAdmin = ['admin', 'barbero'].includes(rolUsuario);
    const where = esAdmin ? '' : 'WHERE r.id_cliente = ?';
    const params = esAdmin ? [] : [usuarioId];

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.id_reserva AS id, r.fecha, r.hora AS hora_inicio, r.hora AS hora_fin, r.estado, NULL AS observaciones,
              r.id_cliente AS cliente_id, CONCAT(cli.nombre, ' ', cli.apellido) AS cliente_nombre,
              r.id_barbero AS barbero_id, CONCAT(b.nombre, ' ', b.apellido) AS barbero_nombre,
              s.id_servicio AS servicio_id, s.nombre_servicio AS servicio_nombre, s.duracion AS servicio_duracion
       FROM reserva r
       JOIN usuario_rol cli ON cli.id_usuario = r.id_cliente
       JOIN usuario_rol b ON b.id_usuario = r.id_barbero
       JOIN reserva_servicio rs ON rs.id_reserva = r.id_reserva
       JOIN servicio s ON s.id_servicio = rs.id_servicio
       ${where}
       ORDER BY r.fecha DESC, r.hora DESC`,
      params
    );

    return rows;
  }

  static async obtenerCitaPorId(citaId: number, usuarioId: number, rolUsuario: string): Promise<RowDataPacket> {
    const esAdmin = ['admin', 'barbero'].includes(rolUsuario);
    const where = esAdmin ? 'r.id_reserva = ?' : 'r.id_reserva = ? AND r.id_cliente = ?';
    const params = esAdmin ? [citaId] : [citaId, usuarioId];

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.id_reserva AS id, r.fecha, r.hora AS hora_inicio, r.hora AS hora_fin, r.estado, NULL AS observaciones,
              r.id_cliente AS cliente_id, CONCAT(cli.nombre, ' ', cli.apellido) AS cliente_nombre,
              r.id_barbero AS barbero_id, CONCAT(b.nombre, ' ', b.apellido) AS barbero_nombre,
              s.id_servicio AS servicio_id, s.nombre_servicio AS servicio_nombre, s.duracion AS servicio_duracion
       FROM reserva r
       JOIN usuario_rol cli ON cli.id_usuario = r.id_cliente
       JOIN usuario_rol b ON b.id_usuario = r.id_barbero
       JOIN reserva_servicio rs ON rs.id_reserva = r.id_reserva
       JOIN servicio s ON s.id_servicio = rs.id_servicio
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
      `SELECT id_servicio, duracion FROM servicio WHERE id_servicio = ?`,
      [servicioId]
    );
    if (servicioRows.length === 0) {
      throw { status: 404, message: 'Servicio no encontrado o inactivo' };
    }

    const [barberoRows] = await pool.query<RowDataPacket[]>(
      `SELECT id_usuario
       FROM usuario_rol
       WHERE id_usuario = ? AND estado = 'activo' AND rol IN ('barbero', 'admin')`,
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
      SELECT r.id_reserva AS id
      FROM reserva r
      JOIN reserva_servicio rs ON rs.id_reserva = r.id_reserva
      JOIN servicio s ON s.id_servicio = rs.id_servicio
      WHERE r.id_barbero = ?
        AND fecha = ?
        AND estado IN ('pendiente', 'confirmada')
        AND (? < ADDTIME(r.hora, SEC_TO_TIME(s.duracion * 60)) AND ? > r.hora)
        ${citaExcluirId ? 'AND r.id_reserva <> ?' : ''}
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
      `SELECT id_usuario AS id, CONCAT(nombre, ' ', apellido) AS nombre, correo_electronico AS correo
       FROM usuario_rol
       WHERE estado = 'activo' AND rol IN ('barbero', 'admin')
       ORDER BY nombre ASC`
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
      `SELECT id_usuario FROM usuario_rol WHERE id_usuario = ? AND rol = 'cliente' AND estado = 'activo'`,
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
      `INSERT INTO reserva (id_cliente, id_barbero, fecha, hora, estado, recordatorio)
       VALUES (?, ?, ?, ?, 'pendiente', 0)`,
      [
        input.cliente_id,
        barberoId,
        input.fecha,
        input.hora,
      ]
    );
    await pool.query(
      `INSERT INTO reserva_servicio (id_reserva, id_servicio) VALUES (?, ?)`,
      [result.insertId, input.servicio_id]
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
      `SELECT * FROM reserva WHERE id_reserva = ?`,
      [citaId]
    );
    if (citaRows.length === 0) {
      throw { status: 404, message: 'Cita no encontrada' };
    }

    const cita = citaRows[0];
    const esAdmin = ['admin', 'barbero'].includes(input.rol_usuario);
    if (!esAdmin && Number(cita.id_cliente) !== input.actualizado_por) {
      throw { status: 403, message: 'No tienes permisos para modificar esta cita' };
    }

    if (cita.estado === 'cancelada' || cita.estado === 'completada') {
      throw { status: 400, message: 'No se puede modificar una cita cancelada o atendida' };
    }

    const fechaNueva = (input.fecha ?? cita.fecha).toString().slice(0, 10);
    const horaNueva = (input.hora ?? cita.hora).toString().slice(0, 5);
    const [servicioRows] = await pool.query<RowDataPacket[]>(
      `SELECT id_servicio FROM reserva_servicio WHERE id_reserva = ? LIMIT 1`,
      [citaId]
    );
    const servicioNuevo = Number(input.servicio_id ?? servicioRows[0]?.id_servicio);
    const barberoNuevo = Number(input.barbero_id ?? cita.id_barbero);

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
      `UPDATE reserva SET fecha = ?, hora = ?, id_barbero = ? WHERE id_reserva = ?`,
      [
        fechaNueva,
        horaNueva,
        barberoNuevo,
        citaId,
      ]
    );
    if (input.servicio_id) {
      await pool.query(
        `UPDATE reserva_servicio SET id_servicio = ? WHERE id_reserva = ?`,
        [servicioNuevo, citaId]
      );
    }

    await HistorialService.registrar({
      usuario_id: input.actualizado_por,
      accion: 'MODIFICAR',
      modulo: 'citas',
      descripcion: `Cita #${citaId} modificada`,
      datos_antes: {
        fecha: cita.fecha,
        hora_inicio: cita.hora,
        servicio_id: servicioRows[0]?.id_servicio,
        barbero_id: cita.id_barbero,
      },
      datos_despues: {
        fecha: fechaNueva,
        hora_inicio: horaNueva,
        servicio_id: servicioNuevo,
        barbero_id: barberoNuevo,
      },
    });

    await this.notificarCambioCita(citaId, 'RESERVA_CONFIRMADA', barberoNuevo);
  }

  static async cancelarCita(
    citaId: number,
    usuarioSolicitanteId: number,
    rolUsuario: string,
    estadoFinal: EstadoCita = 'cancelada'
  ): Promise<void> {
    const [citaRows] = await pool.query<RowDataPacket[]>(
      `SELECT id_reserva, id_cliente, id_barbero, estado FROM reserva WHERE id_reserva = ?`,
      [citaId]
    );
    if (citaRows.length === 0) {
      throw { status: 404, message: 'Cita no encontrada' };
    }

    const cita = citaRows[0];
    const esAdmin = ['admin', 'barbero'].includes(rolUsuario);
    if (!esAdmin && Number(cita.id_cliente) !== usuarioSolicitanteId) {
      throw { status: 403, message: 'No tienes permisos para cancelar esta cita' };
    }

    if (cita.estado === 'completada') {
      throw { status: 400, message: 'No se puede cancelar una cita ya atendida' };
    }
    if (cita.estado === 'cancelada') {
      throw { status: 400, message: 'La cita ya se encuentra cancelada' };
    }

    await pool.query(
      `UPDATE reserva SET estado = ? WHERE id_reserva = ?`,
      [estadoFinal, citaId]
    );

    await HistorialService.registrar({
      usuario_id: usuarioSolicitanteId,
      accion: 'MODIFICAR',
      modulo: 'citas',
      descripcion: `Cita #${citaId} cancelada`,
      datos_despues: { estado: 'cancelada' },
    });

    await this.notificarCambioCita(citaId, 'RESERVA_CANCELADA', Number(cita.id_barbero));
  }

  static async eliminarCita(citaId: number, usuarioSolicitanteId: number, rolUsuario: string): Promise<void> {
    const cita = await this.obtenerCitaPorId(citaId, usuarioSolicitanteId, rolUsuario);
    if (cita.estado === 'completada') {
      throw { status: 400, message: 'No se puede eliminar una cita atendida' };
    }

    await pool.query(`DELETE FROM reserva WHERE id_reserva = ?`, [citaId]);

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
    tipo: 'RESERVA_CONFIRMADA' | 'RESERVA_CANCELADA',
    barberoId: number
  ): Promise<void> {
    const [admins] = await pool.query<RowDataPacket[]>(
      `SELECT id_usuario AS id
       FROM usuario_rol
       WHERE estado = 'activo' AND rol = 'admin'`
    );

    const destinatarios = new Set<number>([barberoId, ...admins.map((row) => Number(row.id))]);
    const titulo = tipo === 'RESERVA_CONFIRMADA' ? 'Reserva actualizada' : 'Reserva cancelada';
    const mensaje = `La reserva #${citaId} fue ${tipo === 'RESERVA_CONFIRMADA' ? 'actualizada' : 'cancelada'}.`;

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
      `SELECT r.id_reserva AS id, r.id_cliente AS cliente_id, r.fecha, r.hora AS hora_inicio, u.nombre, r.recordatorio
       FROM reserva r
       JOIN usuario_rol u ON u.id_usuario = r.id_cliente
       WHERE r.estado IN ('pendiente', 'confirmada')
         AND TIMESTAMP(r.fecha, r.hora) BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? MINUTE)
         AND r.recordatorio = 0`,
      [REMINDER_MINUTES]
    );

    for (const cita of rows) {
      await NotificacionesService.crear({
        usuario_id: Number(cita.cliente_id),
        tipo: 'RECORDATORIO_RESERVA',
        titulo: 'Recordatorio de reserva',
        mensaje: `Tienes una reserva el ${String(cita.fecha).slice(0, 10)} a las ${String(cita.hora_inicio).slice(0, 5)}.`,
        referencia_id: Number(cita.id),
      });

      await pool.query(
        `UPDATE reserva SET recordatorio = 1 WHERE id_reserva = ?`,
        [cita.id]
      );
    }

    return { procesadas: rows.length };
  }
}
