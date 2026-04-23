import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
export declare function validar(schema: ZodSchema): (req: Request, res: Response, next: NextFunction) => void;
export declare const loginSchema: z.ZodObject<{
    correo: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    correo: string;
}, {
    password: string;
    correo: string;
}>;
export declare const solicitarRecuperacionSchema: z.ZodObject<{
    correo: z.ZodString;
}, "strip", z.ZodTypeAny, {
    correo: string;
}, {
    correo: string;
}>;
export declare const verificarCodigoSchema: z.ZodObject<{
    correo: z.ZodString;
    codigo: z.ZodString;
}, "strip", z.ZodTypeAny, {
    correo: string;
    codigo: string;
}, {
    correo: string;
    codigo: string;
}>;
export declare const resetearPasswordSchema: z.ZodEffects<z.ZodObject<{
    correo: z.ZodString;
    codigo: z.ZodString;
    nueva_password: z.ZodString;
    confirmar_password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    correo: string;
    codigo: string;
    nueva_password: string;
    confirmar_password: string;
}, {
    correo: string;
    codigo: string;
    nueva_password: string;
    confirmar_password: string;
}>, {
    correo: string;
    codigo: string;
    nueva_password: string;
    confirmar_password: string;
}, {
    correo: string;
    codigo: string;
    nueva_password: string;
    confirmar_password: string;
}>;
export declare const asignarRolSchema: z.ZodObject<{
    usuario_id: z.ZodNumber;
    rol_id: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    usuario_id: number;
    rol_id: number;
}, {
    usuario_id: number;
    rol_id: number;
}>;
export declare const actualizarPermisosSchema: z.ZodObject<{
    permisos_ids: z.ZodArray<z.ZodNumber, "many">;
}, "strip", z.ZodTypeAny, {
    permisos_ids: number[];
}, {
    permisos_ids: number[];
}>;
export declare const registroSchema: z.ZodEffects<z.ZodObject<{
    nombre: z.ZodString;
    correo: z.ZodString;
    password: z.ZodString;
    confirmar_password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    correo: string;
    nombre: string;
    confirmar_password: string;
}, {
    password: string;
    correo: string;
    nombre: string;
    confirmar_password: string;
}>, {
    password: string;
    correo: string;
    nombre: string;
    confirmar_password: string;
}, {
    password: string;
    correo: string;
    nombre: string;
    confirmar_password: string;
}>;
//# sourceMappingURL=validar.middleware.d.ts.map