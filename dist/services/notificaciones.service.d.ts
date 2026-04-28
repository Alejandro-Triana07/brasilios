import { Notificacion } from '../types';
interface CrearNotificacionParams {
    usuario_id: number;
    tipo: 'RESERVA_PENDIENTE' | 'RESERVA_CONFIRMADA' | 'RESERVA_CANCELADA' | 'RECORDATORIO_RESERVA';
    titulo: string;
    mensaje: string;
    referencia_id?: number;
}
export declare class NotificacionesService {
    static crear(params: CrearNotificacionParams): Promise<void>;
    static listarPorUsuario(usuarioId: number): Promise<Notificacion[]>;
    static marcarLeida(notificacionId: number, usuarioId: number): Promise<void>;
}
export {};
//# sourceMappingURL=notificaciones.service.d.ts.map