export declare function login(correo: string, password: string, ip: string, userAgent: string): Promise<{
    accessToken: string;
    refreshToken: string;
    rol: string;
}>;
export declare function logout(token: string, usuarioId: number, ip: string, userAgent: string): Promise<void>;
export declare function solicitarRecuperacion(correo: string): Promise<void>;
export declare function verificarCodigo(correo: string, codigo: string): Promise<number>;
export declare function resetearPassword(correo: string, codigo: string, nuevaPassword: string): Promise<void>;
export declare function estaRevocado(jti: string): Promise<boolean>;
export declare function registro(nombre: string, correo: string, password: string, ip: string, userAgent: string): Promise<{
    accessToken: string;
    refreshToken: string;
    rol: string;
}>;
//# sourceMappingURL=auth.service.d.ts.map