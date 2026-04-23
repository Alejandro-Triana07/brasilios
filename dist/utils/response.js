"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ok = ok;
exports.created = created;
exports.badRequest = badRequest;
exports.unauthorized = unauthorized;
exports.forbidden = forbidden;
exports.notFound = notFound;
exports.serverError = serverError;
exports.conflict = conflict;
function ok(res, message, data) {
    const body = { success: true, message, data };
    return res.status(200).json(body);
}
function created(res, message, data) {
    const body = { success: true, message, data };
    return res.status(201).json(body);
}
function badRequest(res, message, errors) {
    const body = { success: false, message, errors };
    return res.status(400).json(body);
}
function unauthorized(res, message) {
    const body = { success: false, message };
    return res.status(401).json(body);
}
function forbidden(res, message) {
    const body = { success: false, message };
    return res.status(403).json(body);
}
function notFound(res, message) {
    const body = { success: false, message };
    return res.status(404).json(body);
}
function serverError(res, message = 'Error interno del servidor') {
    const body = { success: false, message };
    return res.status(500).json(body);
}
function conflict(res, message) {
    const body = { success: false, message };
    return res.status(409).json(body);
}
//# sourceMappingURL=response.js.map