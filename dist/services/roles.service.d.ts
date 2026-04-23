import { Permiso, Rol } from '../types';
export declare class RolesService {
    static listarRoles(): Promise<(Rol & {
        permisos: Permiso[];
    })[]>;
    static actualizarPermisosRol(rolId: number, permisosIds: number[], adminId: number, ip: string, userAgent: string): Promise<void>;
    static asignarRolUsuario(usuarioId: number, rolId: number, adminId: number, ip: string, userAgent: string): Promise<void>;
    static listarPermisos(): Promise<Permiso[]>;
}
//# sourceMappingURL=roles.service.d.ts.map