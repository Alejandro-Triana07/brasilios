import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { pool } from '../config/database';
import { HistorialService } from './historial.service';
import { enviarCodigoRecuperacion } from '../utils/email';
import { generarAccessToken, generarRefreshToken, verificarAccessToken } from '../utils/jwt';
import { Usuario } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const MAX_INTENTOS    = Number(process.env.MAX_LOGIN_ATTEMPTS)      || 5;
const LOCK_MINUTES    = Number(process.env.LOCK_TIME_MINUTES)        || 15;
const CODE_EXPIRES    = Number(process.env.RESET_CODE_EXPIRES_MINUTES) || 15;

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
    `SELECT u.*, r.nombre AS rol_nombre
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE u.correo = ?`,
    [correo]
  );

  // Usuario no registrado
  if (rows.length === 0) {
    throw { status: 401, message: 'Usuario no registrado' };
  }

  const usuario = rows[0] as Usuario & { rol_nombre: string };

  // Cuenta inactiva
  if (!usuario.activo) {
    throw { status: 403, message: 'Cuenta inactiva. Contacte al administrador.' };
  }

  // Cuenta bloqueada
  if (usuario.bloqueado_hasta && new Date() < new Date(usuario.bloqueado_hasta)) {
    const minutos = Math.ceil(
      (new Date(usuario.bloqueado_hasta).getTime() - Date.now()) / 60000
    );
    throw {
      status: 403,
      message: `Cuenta bloqueada. Intente en ${minutos} minuto(s).`,
    };
  }

  // Verificar contraseña
  const passwordCorrecta = await bcrypt.compare(password, usuario.password_hash);

  if (!passwordCorrecta) {
    const nuevoIntentos = usuario.intentos_fallidos + 1;
    let bloqueadoHasta: string | null = null;

    if (nuevoIntentos >= MAX_INTENTOS) {
      const fecha = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      bloqueadoHasta = fecha.toISOString().slice(0, 19).replace('T', ' ');

      await pool.query(
        `UPDATE usuarios SET intentos_fallidos = ?, bloqueado_hasta = ? WHERE id = ?`,
        [nuevoIntentos, bloqueadoHasta, usuario.id]
      );

      await HistorialService.registrar({
        usuario_id:  usuario.id,
        accion:      'BLOQUEO',
        modulo:      'autenticacion',
        descripcion: `Cuenta bloqueada por ${MAX_INTENTOS} intentos fallidos`,
        ip_address:  ip,
        user_agent:  userAgent,
      });

      throw { status: 403, message: `Cuenta bloqueada por ${LOCK_MINUTES} minutos.` };
    }

    await pool.query(
      `UPDATE usuarios SET intentos_fallidos = ? WHERE id = ?`,
      [nuevoIntentos, usuario.id]
    );

    throw {
      status: 401,
      message: `Contraseña incorrecta. Intentos restantes: ${MAX_INTENTOS - nuevoIntentos}`,
    };
  }

  // Login exitoso → resetear intentos
  await pool.query(
    `UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_login = NOW() WHERE id = ?`,
    [usuario.id]
  );

  const accessToken  = generarAccessToken({ sub: usuario.id, rol: usuario.rol_nombre, correo: usuario.correo });
  const refreshToken = generarRefreshToken(usuario.id);

  await HistorialService.registrar({
    usuario_id:  usuario.id,
    accion:      'LOGIN',
    modulo:      'autenticacion',
    descripcion: 'Inicio de sesión exitoso',
    ip_address:  ip,
    user_agent:  userAgent,
  });

  return { accessToken, refreshToken, rol: usuario.rol_nombre };
}

// -------------------------------------------------------
// HU-1.6  Cierre de sesión seguro (blacklist del JTI)
// -------------------------------------------------------
export async function logout(
  token: string,
  usuarioId: number,
  ip: string,
  userAgent: string
): Promise<void> {
  const payload = verificarAccessToken(token);

  const expira = payload.exp
    ? new Date(payload.exp * 1000).toISOString().slice(0, 19).replace('T', ' ')
    : new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ');

  await pool.query(
    `INSERT IGNORE INTO tokens_revocados (jti, usuario_id, expira_en) VALUES (?, ?, ?)`,
    [payload.jti, usuarioId, expira]
  );

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
    `SELECT id, nombre, activo FROM usuarios WHERE correo = ?`,
    [correo]
  );

  if (rows.length === 0) {
    throw { status: 404, message: 'Usuario no registrado' };
  }

  const usuario = rows[0];

  // Generar código numérico de 6 dígitos
  const codigo    = crypto.randomInt(100000, 999999).toString();
  const expiraEn  = new Date(Date.now() + CODE_EXPIRES * 60 * 1000)
    .toISOString().slice(0, 19).replace('T', ' ');

  // Invalidar códigos anteriores
  await pool.query(
    `UPDATE reset_tokens SET usado = 1 WHERE usuario_id = ? AND usado = 0`,
    [usuario.id]
  );

  await pool.query(
    `INSERT INTO reset_tokens (usuario_id, codigo, expira_en) VALUES (?, ?, ?)`,
    [usuario.id, codigo, expiraEn]
  );

  await enviarCodigoRecuperacion(correo, usuario.nombre, codigo);
}

// -------------------------------------------------------
// HU-1.4  Verificar código de recuperación
// -------------------------------------------------------
export async function verificarCodigo(correo: string, codigo: string): Promise<number> {
  const [userRows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM usuarios WHERE correo = ?`,
    [correo]
  );

  if (userRows.length === 0) {
    throw { status: 404, message: 'Usuario no registrado' };
  }

  const usuarioId = userRows[0].id as number;

  const [tokenRows] = await pool.query<RowDataPacket[]>(
    `SELECT id, expira_en, usado
     FROM reset_tokens
     WHERE usuario_id = ? AND codigo = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [usuarioId, codigo]
  );

  if (tokenRows.length === 0) {
    throw { status: 400, message: 'Código incorrecto' };
  }

  const token = tokenRows[0];

  if (token.usado) {
    throw { status: 400, message: 'El código ya fue utilizado' };
  }

  if (new Date() > new Date(token.expira_en)) {
    throw { status: 400, message: 'El código ha expirado. Solicita uno nuevo.' };
  }

  return token.id as number;
}

// -------------------------------------------------------
// HU-1.5  Establecer nueva contraseña
// -------------------------------------------------------
export async function resetearPassword(
  correo: string,
  codigo: string,
  nuevaPassword: string
): Promise<void> {
  const tokenId = await verificarCodigo(correo, codigo);

  // Validar seguridad de la contraseña
  const passwordSegura = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(nuevaPassword);
  if (!passwordSegura) {
    throw {
      status: 400,
      message: 'Contraseña insegura. Debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.',
    };
  }

  const [userRows] = await pool.query<RowDataPacket[]>(
    `SELECT id, password_hash FROM usuarios WHERE correo = ?`,
    [correo]
  );

  const usuario = userRows[0];

  // No permitir contraseña repetida
  const esRepetida = await bcrypt.compare(nuevaPassword, usuario.password_hash);
  if (esRepetida) {
    throw { status: 400, message: 'La nueva contraseña no puede ser igual a la anterior.' };
  }

  const hash = await bcrypt.hash(nuevaPassword, 12);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE usuarios SET password_hash = ?, intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?`,
      [hash, usuario.id]
    );

    await conn.query(
      `UPDATE reset_tokens SET usado = 1 WHERE id = ?`,
      [tokenId]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw { status: 500, message: 'Error al guardar la contraseña. Intente nuevamente.' };
  } finally {
    conn.release();
  }

  await HistorialService.registrar({
    usuario_id:  usuario.id,
    accion:      'RESET_PASSWORD',
    modulo:      'autenticacion',
    descripcion: 'Contraseña restablecida exitosamente',
  });
}

// -------------------------------------------------------
// Chequear si un JTI está revocado (usado en middleware)
// -------------------------------------------------------
export async function estaRevocado(jti: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM tokens_revocados WHERE jti = ?`,
    [jti]
  );
  return rows.length > 0;
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

  // Verificar si el correo ya existe
  const [existe] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM usuarios WHERE correo = ?`,
    [correo]
  );
  if (existe.length > 0) {
    throw { status: 409, message: 'El correo ya está registrado' };
  }

  // Encriptar contraseña
  const hash = await bcrypt.hash(password, 12);

  // Obtener rol 'empleado' por defecto (id = 3)
  const esEmpleado = correo.endsWith('@brasilios.com');
  const rolNombre  = esEmpleado ? 'empleado' : 'cliente';

  const [rolRows] = await pool.query<RowDataPacket[]>(
  `SELECT id FROM roles WHERE nombre = ? LIMIT 1`,
  [rolNombre]
);
const rolId = rolRows.length > 0 ? rolRows[0].id : 3;

  // Insertar usuario
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO usuarios (nombre, correo, password_hash, rol_id) VALUES (?, ?, ?, ?)`,
    [nombre, correo, hash, rolId]
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

  // Generar tokens
  const accessToken  = generarAccessToken({ sub: usuarioId, rol: 'empleado', correo });
  const refreshToken = generarRefreshToken(usuarioId);

  return { accessToken, refreshToken, rol: rolNombre  };
}