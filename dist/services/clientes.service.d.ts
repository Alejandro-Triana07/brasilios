import { RowDataPacket } from 'mysql2';
interface CrearClienteInput {
    nombre: string;
    telefono: string;
    correo: string;
    adminId: number;
}
interface ActualizarClienteInput {
    nombre?: string;
    telefono?: string;
    correo?: string;
    activo?: boolean;
    adminId: number;
}
export declare class ClientesService {
    static crearCliente(input: CrearClienteInput): Promise<{
        id: number;
    }>;
    static listarClientes(filtro?: string): Promise<RowDataPacket[]>;
    static obtenerClientePorId(id: number): Promise<RowDataPacket>;
    static actualizarCliente(id: number, input: ActualizarClienteInput): Promise<void>;
    static eliminarCliente(id: number, adminId: number): Promise<void>;
    static historialServiciosCliente(id: number): Promise<RowDataPacket[]>;
    private static validarDuplicados;
}
export {};
//# sourceMappingURL=clientes.service.d.ts.map