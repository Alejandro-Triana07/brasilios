const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'brasilios_db',
  });

  try {
    const defaultPassword = await bcrypt.hash('Admin123*', 12);

    await connection.query(
      `INSERT INTO servicios (nombre, descripcion, precio, duracion, activo)
       VALUES
       ('Corte clásico', 'Corte tradicional', 25000, 30, 1),
       ('Barba premium', 'Arreglo de barba', 18000, 20, 1),
       ('Corte + Barba', 'Combo completo', 38000, 50, 1)
       ON DUPLICATE KEY UPDATE
         descripcion = VALUES(descripcion),
         precio = VALUES(precio),
         duracion = VALUES(duracion),
         activo = VALUES(activo)`
    );

    await connection.query(
      `INSERT INTO usuarios (nombre, correo, password_hash, rol_id, activo)
       SELECT 'Admin Brasilios', 'admin@brasilios.com', ?, r.id, 1
       FROM roles r
       WHERE r.nombre = 'administrador'
       ON DUPLICATE KEY UPDATE
         nombre = VALUES(nombre),
         password_hash = VALUES(password_hash),
         activo = 1`,
      [defaultPassword]
    );

    await connection.query(
      `INSERT INTO usuarios (nombre, correo, password_hash, rol_id, activo)
       SELECT 'Barbero Demo', 'barbero@brasilios.com', ?, r.id, 1
       FROM roles r
       WHERE r.nombre = 'empleado'
       ON DUPLICATE KEY UPDATE
         nombre = VALUES(nombre),
         password_hash = VALUES(password_hash),
         activo = 1`,
      [defaultPassword]
    );

    await connection.query(
      `INSERT INTO usuarios (nombre, correo, password_hash, rol_id, activo)
       SELECT 'Cliente Demo', 'cliente@correo.com', ?, r.id, 1
       FROM roles r
       WHERE r.nombre = 'cliente'
       ON DUPLICATE KEY UPDATE
         nombre = VALUES(nombre),
         password_hash = VALUES(password_hash),
         activo = 1`,
      [defaultPassword]
    );

    console.log('Datos semilla creados correctamente');
    console.log('Usuario pruebas admin@brasilios.com / Admin123*');
    console.log('Usuario pruebas barbero@brasilios.com / Admin123*');
    console.log('Usuario pruebas cliente@correo.com / Admin123*');
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  const isConnRefused = error?.code === 'ECONNREFUSED'
    || (Array.isArray(error?.errors) && error.errors.some((e) => e?.code === 'ECONNREFUSED'));

  if (isConnRefused) {
    console.error('No se pudo conectar a MySQL para ejecutar seed.');
    console.error('Enciende MySQL y verifica DB_HOST/DB_PORT/DB_USER/DB_PASSWORD.');
    console.error('Sugerencia rápida: usa DB_HOST=127.0.0.1 en lugar de localhost.');
  } else {
    console.error('Error ejecutando seed:', error.message);
  }
  process.exit(1);
});
