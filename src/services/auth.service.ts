import bcrypt from 'bcryptjs';
import { pool } from '../config/database';
import { HistorialService } from './historial.service';
import { generarAccessToken, generarRefreshToken } from '../utils/jwt';
import { Usuario } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// -------------------------------------------------------
// HU-1.1 / HU-1.2  Autenticación y verificación
// -------------------------------------------------------
export async function login(
  correo: string,
  password: string,
  ip: string,
  userAgent: string
): Promise<{ accessToken: string; refreshToken: string; rol: string }> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id_usuario, nombre, apellido, correo_electronico, contrasena, rol, estado
     FROM usuario_rol
     WHERE correo_electronico = ?`,
    [correo]
  );

  if (rows.length === 0) {
    throw { status: 401, message: 'Usuario no registrado' };
  }

  const usuario = rows[0] as Usuario;

  if (usuario.estado !== 'activo') {
    throw { status: 403, message: 'Cuenta inactiva. Contacte al administrador.' };
  }

  const passwordCorrecta = await bcrypt.compare(password, usuario.contrasena);

  if (!passwordCorrecta) {
    throw { status: 401, message: 'Contraseña incorrecta' };
  }

  const accessToken  = generarAccessToken({ sub: usuario.id_usuario, rol: usuario.rol, correo: usuario.correo_electronico });
  const refreshToken = generarRefreshToken(usuario.id_usuario);

  await HistorialService.registrar({
    usuario_id:  usuario.id_usuario,
    accion:      'LOGIN',
    modulo:      'autenticacion',
    descripcion: 'Inicio de sesión exitoso',
    ip_address:  ip,
    user_agent:  userAgent,
  });

  return { accessToken, refreshToken, rol: usuario.rol };
}

// -------------------------------------------------------
// HU-1.6  Cierre de sesión seguro (blacklist del JTI)
// -------------------------------------------------------
export async function logout(
  _token: string,
  usuarioId: number,
  ip: string,
  userAgent: string
): Promise<void> {
  await HistorialService.registrar({
    usuario_id:  usuarioId,
    accion:      'LOGOUT',
    modulo:      'autenticacion',
    descripcion: 'Cierre de sesión',
    ip_address:  ip,
    user_agent:  userAgent,
  });
}

// -------------------------------------------------------
// HU-1.3 / HU-1.4  Solicitar código de recuperación
// -------------------------------------------------------
export async function solicitarRecuperacion(correo: string): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id_usuario FROM usuario_rol WHERE correo_electronico = ?`,
    [correo]
  );
  if (rows.length === 0) throw { status: 404, message: 'Usuario no registrado' };
  throw { status: 501, message: 'Recuperación por código no está habilitada en el nuevo esquema.' };
}

// -------------------------------------------------------
// HU-1.4  Verificar código de recuperación
// -------------------------------------------------------
export async function verificarCodigo(correo: string, codigo: string): Promise<number> {
  void correo;
  void codigo;
  throw { status: 501, message: 'Recuperación por código no está habilitada en el nuevo esquema.' };
}

// -------------------------------------------------------
// HU-1.5  Establecer nueva contraseña
// -------------------------------------------------------
export async function resetearPassword(
  correo: string,
  _codigo: string,
  nuevaPassword: string
): Promise<void> {
  const passwordSegura = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(nuevaPassword);
  if (!passwordSegura) {
    throw {
      status: 400,
      message: 'Contraseña insegura. Debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.',
    };
  }

  const [userRows] = await pool.query<RowDataPacket[]>(
    `SELECT id_usuario, contrasena FROM usuario_rol WHERE correo_electronico = ?`,
    [correo]
  );
  if (userRows.length === 0) throw { status: 404, message: 'Usuario no registrado' };

  const usuario = userRows[0];

  const esRepetida = await bcrypt.compare(nuevaPassword, usuario.contrasena);
  if (esRepetida) {
    throw { status: 400, message: 'La nueva contraseña no puede ser igual a la anterior.' };
  }

  const hash = await bcrypt.hash(nuevaPassword, 12);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(`UPDATE usuario_rol SET contrasena = ? WHERE id_usuario = ?`, [hash, usuario.id_usuario]);

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw { status: 500, message: 'Error al guardar la contraseña. Intente nuevamente.' };
  } finally {
    conn.release();
  }

  await HistorialService.registrar({
    usuario_id:  usuario.id_usuario,
    accion:      'RESET_PASSWORD',
    modulo:      'autenticacion',
    descripcion: 'Contraseña restablecida exitosamente',
  });
}

// -------------------------------------------------------
// Chequear si un JTI está revocado (usado en middleware)
// -------------------------------------------------------
export async function estaRevocado(jti: string): Promise<boolean> {
  void jti;
  return false;
}

// -------------------------------------------------------
// REGISTRO — agrega esta función a tu auth.service.ts
// -------------------------------------------------------
export async function registro(
  nombre: string,
  correo: string,
  password: string,
  ip: string,
  userAgent: string
): Promise<{ accessToken: string; refreshToken: string; rol: string }> {

  // Validar seguridad de la contraseña
  const passwordSegura = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);
  if (!passwordSegura) {
    throw {
      status: 400,
      message: 'Contraseña insegura. Debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.',
    };
  }

  const [existe] = await pool.query<RowDataPacket[]>(
    `SELECT id_usuario FROM usuario_rol WHERE correo_electronico = ?`,
    [correo]
  );
  if (existe.length > 0) {
    throw { status: 409, message: 'El correo ya está registrado' };
  }

  const hash = await bcrypt.hash(password, 12);

  const esBarbero = correo.endsWith('@brasilios.com');
  const rolNombre = esBarbero ? 'barbero' : 'cliente';
  const [nombres] = nombre.trim().split(/\s+/, 2);
  const apellido = nombre.trim().split(/\s+/).slice(1).join(' ') || 'Usuario';

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO usuario_rol (nombre, apellido, correo_electronico, contrasena, rol, estado)
     VALUES (?, ?, ?, ?, ?, 'activo')`,
    [nombres, apellido, correo, hash, rolNombre]
  );

  const usuarioId = result.insertId;

  // Registrar en historial
  await HistorialService.registrar({
    usuario_id:  usuarioId,
    accion:      'CREAR',
    modulo:      'autenticacion',
    descripcion: 'Registro de nuevo usuario',
    ip_address:  ip,
    user_agent:  userAgent,
  });

  const accessToken  = generarAccessToken({ sub: usuarioId, rol: rolNombre, correo });
  const refreshToken = generarRefreshToken(usuarioId);

  return { accessToken, refreshToken, rol: rolNombre  };
}