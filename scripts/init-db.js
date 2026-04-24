const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT || '3306');
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'brasilios_db';

  const statements = [
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    `USE \`${database}\``,
    `CREATE TABLE IF NOT EXISTS roles (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(50) NOT NULL UNIQUE,
      descripcion VARCHAR(255),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS permisos (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      modulo VARCHAR(100) NOT NULL,
      accion VARCHAR(100) NOT NULL,
      descripcion VARCHAR(255),
      UNIQUE KEY uk_modulo_accion (modulo, accion)
    )`,
    `CREATE TABLE IF NOT EXISTS rol_permisos (
      rol_id INT UNSIGNED NOT NULL,
      permiso_id INT UNSIGNED NOT NULL,
      PRIMARY KEY (rol_id, permiso_id),
      FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS usuarios (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(150) NOT NULL,
      correo VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      rol_id INT UNSIGNED NOT NULL,
      activo TINYINT(1) DEFAULT 1,
      intentos_fallidos INT DEFAULT 0,
      bloqueado_hasta DATETIME NULL,
      ultimo_login DATETIME NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (rol_id) REFERENCES roles(id)
    )`,
    `CREATE TABLE IF NOT EXISTS reset_tokens (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT UNSIGNED NOT NULL,
      codigo VARCHAR(10) NOT NULL,
      expira_en DATETIME NOT NULL,
      usado TINYINT(1) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS tokens_revocados (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      jti VARCHAR(36) NOT NULL UNIQUE,
      usuario_id INT UNSIGNED NOT NULL,
      expira_en DATETIME NOT NULL,
      revocado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS historial_cambios (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT UNSIGNED NULL,
      accion ENUM('CREAR','MODIFICAR','ELIMINAR','LOGIN','LOGOUT','BLOQUEO','RESET_PASSWORD') NOT NULL,
      modulo VARCHAR(100) NOT NULL,
      descripcion TEXT,
      ip_address VARCHAR(45),
      user_agent VARCHAR(500),
      datos_antes JSON NULL,
      datos_despues JSON NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS servicios (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(120) NOT NULL,
      descripcion TEXT NULL,
      precio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      duracion INT NOT NULL,
      activo TINYINT(1) DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS citas (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      cliente_id INT UNSIGNED NOT NULL,
      barbero_id INT UNSIGNED NOT NULL,
      servicio_id INT UNSIGNED NOT NULL,
      fecha DATE NOT NULL,
      hora_inicio TIME NOT NULL,
      hora_fin TIME NOT NULL,
      estado ENUM('pendiente','confirmada','atendida','cancelada') NOT NULL DEFAULT 'pendiente',
      observaciones TEXT NULL,
      creado_por INT UNSIGNED NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
      FOREIGN KEY (barbero_id) REFERENCES usuarios(id),
      FOREIGN KEY (servicio_id) REFERENCES servicios(id),
      FOREIGN KEY (creado_por) REFERENCES usuarios(id),
      INDEX idx_cita_barbero_fecha (barbero_id, fecha, hora_inicio),
      INDEX idx_cita_cliente_fecha (cliente_id, fecha, hora_inicio)
    )`,
    `CREATE TABLE IF NOT EXISTS notificaciones (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT UNSIGNED NOT NULL,
      tipo ENUM('CITA_MODIFICADA','CITA_CANCELADA','RECORDATORIO_CITA') NOT NULL,
      titulo VARCHAR(160) NOT NULL,
      mensaje TEXT NOT NULL,
      referencia_tipo VARCHAR(50) DEFAULT 'cita',
      referencia_id INT UNSIGNED NULL,
      leida TINYINT(1) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      INDEX idx_notif_usuario_leida (usuario_id, leida, created_at)
    )`,
    `CREATE TABLE IF NOT EXISTS cita_recordatorios (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      cita_id INT UNSIGNED NOT NULL UNIQUE,
      enviado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE CASCADE
    )`,
    `INSERT IGNORE INTO roles (nombre, descripcion) VALUES
      ('administrador', 'Acceso total al sistema'),
      ('dueña', 'Propietaria con acceso administrativo'),
      ('empleado', 'Acceso limitado a módulos operativos'),
      ('cliente', 'Cliente final del sistema')`,
    `INSERT IGNORE INTO permisos (modulo, accion, descripcion) VALUES
      ('usuarios', 'crear', 'Crear nuevos usuarios'),
      ('usuarios', 'editar', 'Editar usuarios existentes'),
      ('usuarios', 'eliminar', 'Eliminar usuarios'),
      ('usuarios', 'ver', 'Ver listado de usuarios'),
      ('roles', 'gestionar', 'Gestionar roles y permisos'),
      ('historial', 'ver', 'Ver historial de cambios'),
      ('citas', 'crear', 'Crear citas'),
      ('citas', 'editar', 'Modificar citas'),
      ('citas', 'cancelar', 'Cancelar citas'),
      ('citas', 'ver', 'Visualizar citas'),
      ('notificaciones', 'ver', 'Visualizar notificaciones')`,
    `INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
      SELECT r.id, p.id FROM roles r CROSS JOIN permisos p WHERE r.nombre = 'administrador'`,
    `INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
      SELECT r.id, p.id FROM roles r CROSS JOIN permisos p WHERE r.nombre = 'dueña'`,
    `INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
      SELECT r.id, p.id FROM roles r JOIN permisos p ON p.accion = 'ver' WHERE r.nombre = 'empleado'`,
    `INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
      SELECT r.id, p.id
      FROM roles r
      JOIN permisos p
        ON (p.modulo = 'citas' AND p.accion IN ('crear', 'editar', 'cancelar', 'ver'))
        OR (p.modulo = 'notificaciones' AND p.accion = 'ver')
      WHERE r.nombre = 'cliente'`,
  ];

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
  });

  try {
    for (const statement of statements) {
      await connection.query(statement);
    }
    console.log('Base de datos inicializada correctamente con consultas directas MySQL');
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  const isConnRefused = error?.code === 'ECONNREFUSED'
    || (Array.isArray(error?.errors) && error.errors.some((e) => e?.code === 'ECONNREFUSED'));

  if (isConnRefused) {
    console.error('No se pudo conectar a MySQL en el puerto configurado.');
    console.error('Verifica que MySQL esté encendido y escuchando en DB_HOST/DB_PORT.');
    console.error('Sugerencia rápida: usa DB_HOST=127.0.0.1 en lugar de localhost.');
  } else {
    console.error('Error inicializando DB:', error.message);
  }

  process.exit(1);
});
