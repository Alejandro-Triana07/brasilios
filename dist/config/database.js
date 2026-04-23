"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.testConnection = testConnection;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const dbPort = Number(process.env.DB_PORT ?? '3306');
if (Number.isNaN(dbPort)) {
    throw new Error('DB_PORT debe ser un numero valido');
}
exports.pool = promise_1.default.createPool({
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
async function testConnection() {
    const conn = await exports.pool.getConnection();
    try {
        await conn.ping();
        console.log('Conectado a MySQL correctamente');
    }
    finally {
        conn.release();
    }
}
//# sourceMappingURL=database.js.map