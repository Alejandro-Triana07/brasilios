"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientesService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../config/database");
const historial_service_1 = require("./historial.service");
class ClientesService {
    static async crearCliente(input) {
        await this.validarDuplicados(input.correo, input.telefono);
        const passwordTemporal = crypto_1.default.randomBytes(12).toString('hex');
        const hash = await bcryptjs_1.default.hash(passwordTemporal, 12);
        const [nombre, ...resto] = input.nombre.trim().split(/\s+/);
        const apellido = resto.join(' ') || 'Cliente';
        const [result] = await database_1.pool.query(`INSERT INTO usuario_rol (nombre, apellido, correo_electronico, contrasena, rol, estado)
       VALUES (?, ?, ?, ?, 'cliente', 'activo')`, [nombre, apellido, input.correo, hash]);
        await historial_service_1.HistorialService.registrar({
            usuario_id: input.adminId,
            accion: 'CREAR',
            modulo: 'clientes',
            descripcion: `Cliente #${result.insertId} registrado`,
            datos_despues: { cliente_id: result.insertId, correo: input.correo, telefono: input.telefono },
        });
        return { id: result.insertId };
    }
    static async listarClientes(filtro) {
        const where = filtro
            ? `AND (
          CONCAT(u.nombre, ' ', u.apellido) LIKE ?
          OR u.correo_electronico LIKE ?
        )`
            : '';
        const params = filtro ? [`%${filtro}%`, `%${filtro}%`] : [];
        const [rows] = await database_1.pool.query(`SELECT u.id_usuario AS id, u.nombre, u.apellido, NULL AS telefono,
              u.correo_electronico AS correo, (u.estado = 'activo') AS activo,
              u.fecha_creacion AS created_at
       FROM usuario_rol u
       WHERE u.rol = 'cliente' ${where}
       ORDER BY u.nombre ASC`, params);
        return rows;
    }
    static async obtenerClientePorId(id) {
        const [rows] = await database_1.pool.query(`SELECT u.id_usuario AS id, u.nombre, u.apellido, NULL AS telefono,
              u.correo_electronico AS correo, (u.estado = 'activo') AS activo,
              u.fecha_creacion AS created_at, u.fecha_creacion AS updated_at
       FROM usuario_rol u
       WHERE u.id_usuario = ? AND u.rol = 'cliente'
       LIMIT 1`, [id]);
        if (rows.length === 0) {
            throw { status: 404, message: 'Cliente no encontrado' };
        }
        return rows[0];
    }
    static async actualizarCliente(id, input) {
        const cliente = await this.obtenerClientePorId(id);
        await this.validarDuplicados(input.correo, input.telefono, id);
        await database_1.pool.query(`UPDATE usuario_rol
       SET nombre = ?, apellido = ?, correo_electronico = ?, estado = ?
       WHERE id_usuario = ?`, [
            input.nombre ?? cliente.nombre,
            (input.nombre ? input.nombre.split(/\s+/).slice(1).join(' ') : cliente.apellido) || 'Cliente',
            input.correo ?? cliente.correo,
            typeof input.activo === 'boolean' ? (input.activo ? 'activo' : 'inactivo') : (cliente.activo ? 'activo' : 'inactivo'),
            id,
        ]);
        await historial_service_1.HistorialService.registrar({
            usuario_id: input.adminId,
            accion: 'MODIFICAR',
            modulo: 'clientes',
            descripcion: `Cliente #${id} actualizado`,
            datos_antes: { nombre: cliente.nombre, telefono: cliente.telefono, correo: cliente.correo, activo: cliente.activo },
            datos_despues: {
                nombre: input.nombre,
                telefono: input.telefono,
                correo: input.correo,
                activo: input.activo,
            },
        });
    }
    static async eliminarCliente(id, adminId) {
        await this.obtenerClientePorId(id);
        const [result] = await database_1.pool.query(`DELETE FROM usuario_rol WHERE id_usuario = ?`, [id]);
        if (result.affectedRows === 0) {
            throw { status: 404, message: 'Cliente no encontrado' };
        }
        await historial_service_1.HistorialService.registrar({
            usuario_id: adminId,
            accion: 'ELIMINAR',
            modulo: 'clientes',
            descripcion: `Cliente #${id} eliminado`,
        });
    }
    static async historialServiciosCliente(id) {
        await this.obtenerClientePorId(id);
        const [rows] = await database_1.pool.query(`SELECT r.id_reserva AS cita_id, r.fecha, r.hora AS hora_inicio, r.estado,
              GROUP_CONCAT(s.nombre_servicio SEPARATOR ', ') AS servicio,
              SUM(s.precio) AS precio,
              CONCAT(b.nombre, ' ', b.apellido) AS barbero
       FROM reserva r
       JOIN reserva_servicio rs ON rs.id_reserva = r.id_reserva
       JOIN servicio s ON s.id_servicio = rs.id_servicio
       JOIN usuario_rol b ON b.id_usuario = r.id_barbero
       WHERE r.id_cliente = ?
       GROUP BY r.id_reserva, r.fecha, r.hora, r.estado, barbero
       ORDER BY r.fecha DESC, r.hora DESC`, [id]);
        return rows;
    }
    static async validarDuplicados(correo, telefono, excluirId) {
        if (correo) {
            const [rows] = await database_1.pool.query(`SELECT id_usuario FROM usuario_rol WHERE correo_electronico = ? ${excluirId ? 'AND id_usuario <> ?' : ''} LIMIT 1`, excluirId ? [correo, excluirId] : [correo]);
            if (rows.length > 0) {
                throw { status: 409, message: 'Ya existe un cliente con ese correo' };
            }
        }
        void telefono;
    }
}
exports.ClientesService = ClientesService;
//# sourceMappingURL=clientes.service.js.map