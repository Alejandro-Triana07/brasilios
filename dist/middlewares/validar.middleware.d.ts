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
export declare const crearCitaSchema: z.ZodObject<{
    cliente_id: z.ZodNumber;
    servicio_id: z.ZodNumber;
    fecha: z.ZodString;
    hora: z.ZodString;
    barbero_id: z.ZodOptional<z.ZodNumber>;
    observaciones: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    cliente_id: number;
    servicio_id: number;
    fecha: string;
    hora: string;
    barbero_id?: number | undefined;
    observaciones?: string | undefined;
}, {
    cliente_id: number;
    servicio_id: number;
    fecha: string;
    hora: string;
    barbero_id?: number | undefined;
    observaciones?: string | undefined;
}>;
export declare const modificarCitaSchema: z.ZodEffects<z.ZodObject<{
    fecha: z.ZodOptional<z.ZodString>;
    hora: z.ZodOptional<z.ZodString>;
    barbero_id: z.ZodOptional<z.ZodNumber>;
    servicio_id: z.ZodOptional<z.ZodNumber>;
    observaciones: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    servicio_id?: number | undefined;
    fecha?: string | undefined;
    hora?: string | undefined;
    barbero_id?: number | undefined;
    observaciones?: string | undefined;
}, {
    servicio_id?: number | undefined;
    fecha?: string | undefined;
    hora?: string | undefined;
    barbero_id?: number | undefined;
    observaciones?: string | undefined;
}>, {
    servicio_id?: number | undefined;
    fecha?: string | undefined;
    hora?: string | undefined;
    barbero_id?: number | undefined;
    observaciones?: string | undefined;
}, {
    servicio_id?: number | undefined;
    fecha?: string | undefined;
    hora?: string | undefined;
    barbero_id?: number | undefined;
    observaciones?: string | undefined;
}>;
export declare const cancelarCitaSchema: z.ZodEffects<z.ZodObject<{
    confirmar: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    confirmar: boolean;
}, {
    confirmar: boolean;
}>, {
    confirmar: boolean;
}, {
    confirmar: boolean;
}>;
export declare const disponibilidadSchema: z.ZodObject<{
    fecha: z.ZodString;
    hora: z.ZodString;
    servicio_id: z.ZodNumber;
    barbero_id: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    servicio_id: number;
    fecha: string;
    hora: string;
    barbero_id?: number | undefined;
}, {
    servicio_id: number;
    fecha: string;
    hora: string;
    barbero_id?: number | undefined;
}>;
export declare const crearClienteSchema: z.ZodObject<{
    nombre: z.ZodString;
    telefono: z.ZodString;
    correo: z.ZodString;
}, "strip", z.ZodTypeAny, {
    correo: string;
    nombre: string;
    telefono: string;
}, {
    correo: string;
    nombre: string;
    telefono: string;
}>;
export declare const actualizarClienteSchema: z.ZodEffects<z.ZodObject<{
    nombre: z.ZodOptional<z.ZodString>;
    telefono: z.ZodOptional<z.ZodString>;
    correo: z.ZodOptional<z.ZodString>;
    activo: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    activo?: boolean | undefined;
    correo?: string | undefined;
    nombre?: string | undefined;
    telefono?: string | undefined;
}, {
    activo?: boolean | undefined;
    correo?: string | undefined;
    nombre?: string | undefined;
    telefono?: string | undefined;
}>, {
    activo?: boolean | undefined;
    correo?: string | undefined;
    nombre?: string | undefined;
    telefono?: string | undefined;
}, {
    activo?: boolean | undefined;
    correo?: string | undefined;
    nombre?: string | undefined;
    telefono?: string | undefined;
}>;
//# sourceMappingURL=validar.middleware.d.ts.map