// =============================================
// TIPOS Y INTERFACES GLOBALES
// =============================================

export interface Usuario {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo_electronico: string;
  contrasena: string;
  rol: 'admin' | 'barbero' | 'cliente';
  estado: 'activo' | 'inactivo';
  fecha_creacion: Date;
}

export interface Rol {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface Permiso {
  id: string;
  modulo: string;
  accion: string;
  descripcion?: string;
}

export interface ResetToken {
  id: string;
  usuario_id: string;
  codigo: string;
  expira_en: Date;
  usado: boolean;
}

export interface HistorialCambio {
  id_reporte: number;
  id_usuario: number | null;
  tipo: string;
  fecha_generacion: Date;
  descripcion?: string;
  usuario_nombre?: string;
  usuario_correo?: string;
}

export type AccionHistorial =
  | 'CREAR'
  | 'MODIFICAR'
  | 'ELIMINAR'
  | 'LOGIN'
  | 'LOGOUT'
  | 'BLOQUEO'
  | 'RESET_PASSWORD';

export interface JwtPayload {
  sub: number;       // usuario_id
  jti: string;       // token id único (para revocación)
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

export type EstadoCita = 'pendiente' | 'confirmada' | 'cancelada' | 'completada';

export interface Cita {
  id_reserva: number;
  cliente_id: number;
  barbero_id: number;
  servicio_ids: number[];
  fecha: string;
  hora: string;
  estado: EstadoCita;
}

export interface Notificacion {
  id_reserva: number;
  usuario_id: number;
  tipo: 'RESERVA_PENDIENTE' | 'RESERVA_CONFIRMADA' | 'RESERVA_CANCELADA' | 'RECORDATORIO_RESERVA';
  titulo: string;
  mensaje: string;
  leida: boolean | number;
  fecha: string;
  hora: string;
}
