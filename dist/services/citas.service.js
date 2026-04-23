"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CitasService = void 0;
const database_1 = require("../config/database");
const historial_service_1 = require("./historial.service");
const notificaciones_service_1 = require("./notificaciones.service");
const APPOINTMENT_START_HOUR = process.env.APPOINTMENT_START_HOUR ?? '08:00';
const APPOINTMENT_END_HOUR = process.env.APPOINTMENT_END_HOUR ?? '20:00';
const REMINDER_MINUTES = Number(process.env.REMINDER_MINUTES ?? '120');
function parseMinutes(time) {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
}
function addMinutes(time, minutesToAdd) {
    const [hour, minute] = time.split(':').map(Number);
    const date = new Date(2000, 0, 1, hour, minute, 0, 0);
    date.setMinutes(date.getMinutes() + minutesToAdd);
    return date.toTimeString().slice(0, 8);
}
function ensureFutureDateTime(fecha, hora) {
    const requested = new Date(`${fecha}T${hora}:00`);
    if (Number.isNaN(requested.getTime())) {
        throw { status: 400, message: 'Fecha u hora inválidas' };
    }
    if (requested.getTime() <= Date.now()) {
        throw { status: 400, message: 'No puedes registrar o mover citas al pasado' };
    }
}
class CitasService {
    static async validarDisponibilidad(fecha, hora, servicioId, barberoId, citaExcluirId) {
        ensureFutureDateTime(fecha, hora);
        const [servicioRows] = await database_1.pool.query(`SELECT id, duracion FROM servicios WHERE id = ? AND activo = 1`, [servicioId]);
        if (servicioRows.length === 0) {
            throw { status: 404, message: 'Servicio no encontrado o inactivo' };
        }
        const [barberoRows] = await database_1.pool.query(`SELECT u.id
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       WHERE u.id = ? AND u.activo = 1 AND r.nombre IN ('empleado', 'barbero', 'administrador', 'dueña')`, [barberoId]);
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
        const params = [barberoId, fecha, hora, horaFin];
        if (citaExcluirId) {
            params.push(citaExcluirId);
        }
        const [rows] = await database_1.pool.query(query, params);
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
    static async listarBarberosDisponibles(fecha, hora, servicioId) {
        ensureFutureDateTime(fecha, hora);
        const [barberos] = await database_1.pool.query(`SELECT u.id, u.nombre, u.correo
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       WHERE u.activo = 1 AND r.nombre IN ('empleado', 'barbero')
       ORDER BY u.nombre ASC`);
        const disponibles = [];
        for (const barbero of barberos) {
            const disponibilidad = await this.validarDisponibilidad(fecha, hora, servicioId, Number(barbero.id));
            if (disponibilidad.disponible) {
                disponibles.push({
                    id: Number(barbero.id),
                    nombre: barbero.nombre,
                    correo: barbero.correo,
                });
            }
        }
        return disponibles;
    }
    static async crearCita(input) {
        const [clienteRows] = await database_1.pool.query(`SELECT id FROM usuarios WHERE id = ? AND activo = 1`, [input.cliente_id]);
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
        const disponibilidad = await this.validarDisponibilidad(input.fecha, input.hora, input.servicio_id, barberoId);
        if (!disponibilidad.disponible) {
            throw { status: 409, message: disponibilidad.mensaje };
        }
        const [result] = await database_1.pool.query(`INSERT INTO citas
        (cliente_id, barbero_id, servicio_id, fecha, hora_inicio, hora_fin, estado, observaciones, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, 'pendiente', ?, ?)`, [
            input.cliente_id,
            barberoId,
            input.servicio_id,
            input.fecha,
            input.hora,
            disponibilidad.hora_fin,
            input.observaciones ?? null,
            input.creado_por,
        ]);
        await historial_service_1.HistorialService.registrar({
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
    static async modificarCita(citaId, input) {
        const [citaRows] = await database_1.pool.query(`SELECT * FROM citas WHERE id = ?`, [citaId]);
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
        const disponibilidad = await this.validarDisponibilidad(fechaNueva, horaNueva, servicioNuevo, barberoNuevo, citaId);
        if (!disponibilidad.disponible) {
            throw { status: 409, message: disponibilidad.mensaje };
        }
        await database_1.pool.query(`UPDATE citas
       SET fecha = ?, hora_inicio = ?, hora_fin = ?, servicio_id = ?, barbero_id = ?, observaciones = ?
       WHERE id = ?`, [
            fechaNueva,
            horaNueva,
            disponibilidad.hora_fin,
            servicioNuevo,
            barberoNuevo,
            input.observaciones ?? cita.observaciones ?? null,
            citaId,
        ]);
        await historial_service_1.HistorialService.registrar({
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
    static async cancelarCita(citaId, usuarioSolicitanteId, rolUsuario, estadoFinal = 'cancelada') {
        const [citaRows] = await database_1.pool.query(`SELECT id, cliente_id, barbero_id, estado FROM citas WHERE id = ?`, [citaId]);
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
        await database_1.pool.query(`UPDATE citas SET estado = ? WHERE id = ?`, [estadoFinal, citaId]);
        await historial_service_1.HistorialService.registrar({
            usuario_id: usuarioSolicitanteId,
            accion: 'MODIFICAR',
            modulo: 'citas',
            descripcion: `Cita #${citaId} cancelada`,
            datos_despues: { estado: 'cancelada' },
        });
        await this.notificarCambioCita(citaId, 'CITA_CANCELADA', Number(cita.barbero_id));
    }
    static async notificarCambioCita(citaId, tipo, barberoId) {
        const [admins] = await database_1.pool.query(`SELECT u.id
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       WHERE u.activo = 1 AND r.nombre IN ('administrador', 'dueña')`);
        const destinatarios = new Set([barberoId, ...admins.map((row) => Number(row.id))]);
        const titulo = tipo === 'CITA_MODIFICADA' ? 'Cita modificada' : 'Cita cancelada';
        const mensaje = `La cita #${citaId} fue ${tipo === 'CITA_MODIFICADA' ? 'modificada' : 'cancelada'}.`;
        for (const usuarioId of destinatarios) {
            await notificaciones_service_1.NotificacionesService.crear({
                usuario_id: usuarioId,
                tipo,
                titulo,
                mensaje,
                referencia_id: citaId,
            });
        }
    }
    static async ejecutarRecordatoriosAutomaticos() {
        const [rows] = await database_1.pool.query(`SELECT c.id, c.cliente_id, c.fecha, c.hora_inicio, u.nombre
       FROM citas c
       JOIN usuarios u ON u.id = c.cliente_id
       WHERE c.estado IN ('pendiente', 'confirmada')
         AND TIMESTAMP(c.fecha, c.hora_inicio) BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? MINUTE)
         AND NOT EXISTS (
           SELECT 1
           FROM cita_recordatorios cr
           WHERE cr.cita_id = c.id
         )`, [REMINDER_MINUTES]);
        for (const cita of rows) {
            await notificaciones_service_1.NotificacionesService.crear({
                usuario_id: Number(cita.cliente_id),
                tipo: 'RECORDATORIO_CITA',
                titulo: 'Recordatorio de cita',
                mensaje: `Tienes una cita el ${String(cita.fecha).slice(0, 10)} a las ${String(cita.hora_inicio).slice(0, 5)}.`,
                referencia_id: Number(cita.id),
            });
            await database_1.pool.query(`INSERT INTO cita_recordatorios (cita_id, enviado_en) VALUES (?, NOW())`, [cita.id]);
        }
        return { procesadas: rows.length };
    }
}
exports.CitasService = CitasService;
//# sourceMappingURL=citas.service.js.map