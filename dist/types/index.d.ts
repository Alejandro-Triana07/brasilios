export interface Usuario {
    id: number;
    nombre: string;
    correo: string;
    password_hash: string;
    rol_id: number;
    rol_nombre?: string;
    activo: boolean;
    intentos_fallidos: number;
    bloqueado_hasta: Date | null;
    ultimo_login: Date | null;
    created_at: Date;
    updated_at: Date;
}
export interface Rol {
    id: number;
    nombre: string;
    descripcion?: string;
}
export interface Permiso {
    id: number;
    modulo: string;
    accion: string;
    descripcion?: string;
}
export interface ResetToken {
    id: number;
    usuario_id: number;
    codigo: string;
    expira_en: Date;
    usado: boolean;
}
export interface HistorialCambio {
    id: number;
    usuario_id: number | null;
    accion: AccionHistorial;
    modulo: string;
    descripcion?: string;
    ip_address?: string;
    user_agent?: string;
    datos_antes?: Record<string, unknown>;
    datos_despues?: Record<string, unknown>;
    created_at: Date;
}
export type AccionHistorial = 'CREAR' | 'MODIFICAR' | 'ELIMINAR' | 'LOGIN' | 'LOGOUT' | 'BLOQUEO' | 'RESET_PASSWORD';
export interface JwtPayload {
    sub: number;
    jti: string;
    rol: string;
    correo: string;
    iat?: number;
    exp?: number;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    errors?: string[];
}
export interface FiltroHistorial {
    fechaDesde?: string;
    fechaHasta?: string;
    usuarioId?: number;
    modulo?: string;
    accion?: AccionHistorial;
    pagina?: number;
    limite?: number;
}
export type EstadoCita = 'pendiente' | 'confirmada' | 'atendida' | 'cancelada';
export interface Cita {
    id: number;
    cliente_id: number;
    barbero_id: number;
    servicio_id: number;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    estado: EstadoCita;
    observaciones?: string | null;
    creado_por: number;
    created_at: Date;
    updated_at: Date;
}
export interface Notificacion {
    id: number;
    usuario_id: number;
    tipo: 'CITA_MODIFICADA' | 'CITA_CANCELADA' | 'RECORDATORIO_CITA';
    titulo: string;
    mensaje: string;
    referencia_tipo: string;
    referencia_id: number;
    leida: boolean;
    created_at: Date;
}
//# sourceMappingURL=index.d.ts.map