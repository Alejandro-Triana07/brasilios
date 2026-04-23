"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const historial_controller_1 = require("../controllers/historial.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// GET /api/historial
router.get('/', auth_middleware_1.autenticar, historial_controller_1.listarHistorial);
exports.default = router;
//# sourceMappingURL=historial.routes.js.map