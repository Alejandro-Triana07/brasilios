const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'brasilios',
  });

  try {
    await connection.query(
      `INSERT INTO usuario_rol(nombre, apellido, correo_electronico, contrasena, rol)
       VALUES
       ('Administrador', 'Brasilios','admin@brasilios.com','$2a$12$uL9Z9Qx1Kf1ZwRzV3mN8OeWQkP2sD7hYgT5nXjM4bA6cE0vIqRuKS','admin'),
       ('Carlos', 'Perez','carlos@brasilios.com','$2a$12$mK3J7Lx2Nf0YwSzU4nO9PfXRlQ3tE8iZhU6oYkN5cB7dF1wJsStLT','barbero'),
       ('Juan', 'Rodriguez','juan@brasilios.com','$2a$12$mK3J7Lx2Nf0YwSzU4nO9PfXRlQ3tE8iZhU6oYkN5cB7dF1wJsStLT','barbero')
       ON DUPLICATE KEY UPDATE
         nombre = VALUES(nombre),
         apellido = VALUES(apellido),
         contrasena = VALUES(contrasena),
         rol = VALUES(rol)`
    );

    await connection.query(
      `INSERT INTO servicio(nombre_servicio, descripcion, precio, duracion) VALUES
        ('Corte clásico', 'Corte de cabello tradicional', 25000, 30),
        ('Corte + barba', 'Corte de cabello y arreglo de barba', 40000, 50),
        ('Arreglo de barba', 'Perfilado y arreglo de barba', 20000, 20),
        ('Afeitado clásico', 'Afeitado con navaja y toalla caliente',18000, 25),
        ('Corte infantil', 'Corte de cabello para niños', 20000, 25)
      ON DUPLICATE KEY UPDATE
        descripcion = VALUES(descripcion),
        precio = VALUES(precio),
        duracion = VALUES(duracion)`
    );

    await connection.query(
      `INSERT INTO producto(codigo_producto, nombre_producto, descripcion, precio, stock) VALUES
        ('PRD-001', 'Pomada fijadora', 'Fijación fuerte, acabado brillante', 35000, 20),
        ('PRD-002', 'Aceite de barba', 'Hidratación y suavizado de barba', 28000, 15),
        ('PRD-003', 'Shampoo profesional', 'Shampoo para cabello y barba', 22000, 30),
        ('PRD-004', 'Cera mate', 'Fijación media, acabado mate', 32000, 25),
        ('PRD-005', 'Loción aftershave', 'Loción post afeitado refrescante', 25000, 18)
      ON DUPLICATE KEY UPDATE
        nombre_producto = VALUES(nombre_producto),
        descripcion = VALUES(descripcion),
        precio = VALUES(precio),
        stock = VALUES(stock)`
    );

    console.log('Datos semilla creados correctamente');
    console.log('Usuario admin: admin@brasilios.com');
    console.log('Usuario barbero: carlos@brasilios.com');
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
