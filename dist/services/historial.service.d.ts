import { AccionHistorial, FiltroHistorial, HistorialCambio } from '../types';
interface RegistrarParams {
    usuario_id?: number | null;
    accion: AccionHistorial;
    modulo: string;
    descripcion?: string;
    ip_address?: string;
    user_agent?: string;
    datos_antes?: Record<string, unknown>;
    datos_despues?: Record<string, unknown>;
}
export declare class HistorialService {
    static registrar(params: RegistrarParams): Promise<void>;
    static listar(filtros: FiltroHistorial): Promise<{
        registros: HistorialCambio[];
        total: number;
        pagina: number;
        totalPaginas: number;
    }>;
}
export {};
//# sourceMappingURL=historial.service.d.ts.map