import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            usuario?: {
                id: number;
                correo: string;
                rol: string;
            };
        }
    }
}
export declare function autenticar(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function soloRoles(...roles: string[]): (req: Request, res: Response, next: NextFunction) => void;
export declare function requierePermiso(modulo: string, accion: string): (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.middleware.d.ts.map