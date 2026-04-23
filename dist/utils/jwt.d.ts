import { JwtPayload } from '../types';
interface RefreshJwtPayload {
    sub: number;
    jti: string;
    iat?: number;
    exp?: number;
}
export declare function generarAccessToken(payload: Omit<JwtPayload, 'jti' | 'iat' | 'exp'>): string;
export declare function generarRefreshToken(usuarioId: number): string;
export declare function verificarAccessToken(token: string): JwtPayload;
export declare function verificarRefreshToken(token: string): RefreshJwtPayload;
export declare function decodificarToken(token: string): JwtPayload | null;
export {};
//# sourceMappingURL=jwt.d.ts.map