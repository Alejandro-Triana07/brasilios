import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbPort = Number(process.env.DB_PORT ?? '3306');

if (Number.isNaN(dbPort)) {
  throw new Error('DB_PORT debe ser un numero valido');
}

export const pool = mysql.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  port: dbPort,
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'brasilios_db',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT ?? '10'),
  queueLimit: 0,
  timezone: 'Z',
  charset: 'utf8mb4',
  namedPlaceholders: true,
});

export async function testConnection(): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
    console.log('Conectado a MySQL correctamente');
  } finally {
    conn.release();
  }
}
