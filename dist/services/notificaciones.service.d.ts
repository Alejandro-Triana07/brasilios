import { Notificacion } from '../types';
interface CrearNotificacionParams {
    usuario_id: number;
    tipo: 'CITA_MODIFICADA' | 'CITA_CANCELADA' | 'RECORDATORIO_CITA';
    titulo: string;
    mensaje: string;
    referencia_tipo?: string;
    referencia_id?: number;
}
export declare class NotificacionesService {
    static crear(params: CrearNotificacionParams): Promise<void>;
    static listarPorUsuario(usuarioId: number): Promise<Notificacion[]>;
    static marcarLeida(notificacionId: number, usuarioId: number): Promise<void>;
}
export {};
//# sourceMappingURL=notificaciones.service.d.ts.map