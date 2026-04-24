const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT || '3306');
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';

  const schemaPath = path.resolve(__dirname, '..', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
  });

  try {
    await connection.query(schema);
    console.log('Base de datos inicializada correctamente desde schema.sql');
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Error inicializando DB:', error.message);
  process.exit(1);
});
