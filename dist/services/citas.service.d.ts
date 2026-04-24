import { RowDataPacket } from 'mysql2';
import { EstadoCita } from '../types';
interface CrearCitaInput {
    cliente_id: number;
    servicio_id: number;
    fecha: string;
    hora: string;
    barbero_id?: number;
    observaciones?: string;
    creado_por: number;
}
interface ModificarCitaInput {
    fecha?: string;
    hora?: string;
    servicio_id?: number;
    barbero_id?: number;
    observaciones?: string;
    actualizado_por: number;
    rol_usuario: string;
}
export declare class CitasService {
    static listarCitas(usuarioId: number, rolUsuario: string): Promise<RowDataPacket[]>;
    static obtenerCitaPorId(citaId: number, usuarioId: number, rolUsuario: string): Promise<RowDataPacket>;
    static validarDisponibilidad(fecha: string, hora: string, servicioId: number, barberoId: number, citaExcluirId?: number): Promise<{
        disponible: boolean;
        mensaje: string;
        hora_fin: string;
    }>;
    static listarBarberosDisponibles(fecha: string, hora: string, servicioId: number): Promise<Array<{
        id: number;
        nombre: string;
        correo: string;
    }>>;
    static crearCita(input: CrearCitaInput): Promise<{
        id: number;
        mensaje: string;
        barbero_asignado: number;
    }>;
    static modificarCita(citaId: number, input: ModificarCitaInput): Promise<void>;
    static cancelarCita(citaId: number, usuarioSolicitanteId: number, rolUsuario: string, estadoFinal?: EstadoCita): Promise<void>;
    static eliminarCita(citaId: number, usuarioSolicitanteId: number, rolUsuario: string): Promise<void>;
    private static notificarCambioCita;
    static ejecutarRecordatoriosAutomaticos(): Promise<{
        procesadas: number;
    }>;
}
export {};
//# sourceMappingURL=citas.service.d.ts.map