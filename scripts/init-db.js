const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT || '3306');
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'brasilios';

  const statements = [
    `SET NAMES utf8mb4`,
    `SET FOREIGN_KEY_CHECKS = 0`,
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci`,
    `USE \`${database}\``,
    `CREATE TABLE IF NOT EXISTS usuario_rol (
      id_usuario INT NOT NULL AUTO_INCREMENT,
      nombre VARCHAR(100) NOT NULL,
      apellido VARCHAR(100) NOT NULL,
      correo_electronico VARCHAR(150) NOT NULL,
      contrasena VARCHAR(255) NOT NULL,
      rol ENUM('admin','barbero','cliente') NOT NULL,
      estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
      fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id_usuario),
      UNIQUE KEY uq_correo (correo_electronico)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci`,
    `CREATE TABLE IF NOT EXISTS servicio (
      id_servicio INT NOT NULL AUTO_INCREMENT,
      nombre_servicio VARCHAR(150) NOT NULL,
      descripcion TEXT,
      precio DECIMAL(10,2) NOT NULL,
      duracion INT NOT NULL,
      PRIMARY KEY (id_servicio),
      CONSTRAINT chk_servicio_precio CHECK (precio >= 0),
      CONSTRAINT chk_servicio_duracion CHECK (duracion > 0)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci`,
    `CREATE TABLE IF NOT EXISTS producto (
      id_producto INT NOT NULL AUTO_INCREMENT,
      codigo_producto VARCHAR(50) NOT NULL,
      nombre_producto VARCHAR(150) NOT NULL,
      descripcion TEXT,
      precio DECIMAL(10,2) NOT NULL,
      stock INT NOT NULL DEFAULT 0,
      PRIMARY KEY (id_producto),
      UNIQUE KEY uq_codigo_producto (codigo_producto)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci`,
    `CREATE TABLE IF NOT EXISTS reserva (
      id_reserva INT NOT NULL AUTO_INCREMENT,
      id_cliente INT NOT NULL,
      id_barbero INT NOT NULL,
      fecha DATE NOT NULL,
      hora TIME NOT NULL,
      estado ENUM('pendiente','confirmada','cancelada','completada') NOT NULL DEFAULT 'pendiente',
      recordatorio TINYINT(1) NOT NULL DEFAULT 0,
      PRIMARY KEY (id_reserva),
      CONSTRAINT fk_reserva_cliente FOREIGN KEY (id_cliente) REFERENCES usuario_rol(id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT fk_reserva_barbero FOREIGN KEY (id_barbero) REFERENCES usuario_rol(id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci`,
    `CREATE TABLE IF NOT EXISTS reserva_servicio (
      id_reserva INT NOT NULL,
      id_servicio INT NOT NULL,
      PRIMARY KEY (id_reserva, id_servicio),
      CONSTRAINT fk_rs_reserva FOREIGN KEY (id_reserva) REFERENCES reserva(id_reserva) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_rs_servicio FOREIGN KEY (id_servicio) REFERENCES servicio(id_servicio) ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci`,
    `CREATE TABLE IF NOT EXISTS reporte (
      id_reporte INT NOT NULL AUTO_INCREMENT,
      id_usuario INT NOT NULL,
      tipo VARCHAR(50) NOT NULL,
      fecha_generacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id_reporte),
      CONSTRAINT fk_reporte_usuario FOREIGN KEY (id_usuario) REFERENCES usuario_rol(id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci`,
    `CREATE INDEX idx_reserva_fecha ON reserva(fecha)`,
    `CREATE INDEX idx_reserva_barbero ON reserva(id_barbero)`,
    `CREATE INDEX idx_reserva_cliente ON reserva(id_cliente)`,
    `CREATE INDEX idx_usuario_rol ON usuario_rol(rol)`,
    `SET FOREIGN_KEY_CHECKS = 1`,
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
