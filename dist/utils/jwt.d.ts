import { JwtPayload } from '../types';
export declare function generarAccessToken(payload: Omit<JwtPayload, 'jti' | 'iat' | 'exp'>): string;
export declare function generarRefreshToken(usuarioId: number): string;
export declare function verificarAccessToken(token: string): JwtPayload;
export declare function verificarRefreshToken(token: string): JwtPayload;
export declare function decodificarToken(token: string): JwtPayload | null;
//# sourceMappingURL=jwt.d.ts.map