"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
// Rutas
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const historial_routes_1 = __importDefault(require("./routes/historial.routes"));
const roles_routes_1 = __importDefault(require("./routes/roles.routes"));
const citas_routes_1 = __importDefault(require("./routes/citas.routes"));
const notificaciones_routes_1 = __importDefault(require("./routes/notificaciones.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// ─── Middlewares globales ─────────────────────────────────────────────────────
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// ─── Rutas ────────────────────────────────────────────────────────────────────
app.use('/api/auth', auth_routes_1.default);
app.use('/api/historial', historial_routes_1.default);
app.use('/api/roles', roles_routes_1.default);
app.use('/api/citas', citas_routes_1.default);
app.use('/api/notificaciones', notificaciones_routes_1.default);
// ─── Ruta base ────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
    res.json({ ok: true, mensaje: 'API Brasilios funcionando ✅' });
});
app.get('/api/health/db', async (_req, res) => {
    try {
        const [rows] = await database_1.pool.query('SELECT DATABASE() AS db, NOW() AS server_time');
        res.status(200).json({
            ok: true,
            mensaje: 'Conexión a DB activa',
            data: rows,
        });
    }
    catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'Error de conexión con DB',
            error: error instanceof Error ? error.message : 'Error desconocido',
        });
    }
});
// ─── Servidor ─────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT || 3000);
async function bootstrap() {
    await (0, database_1.testConnection)();
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
}
bootstrap().catch((error) => {
    console.error('No se pudo iniciar la API:', error);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=app.js.map