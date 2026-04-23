import { Response } from 'express';
export declare function ok<T>(res: Response, message: string, data?: T): Response;
export declare function created<T>(res: Response, message: string, data?: T): Response;
export declare function badRequest(res: Response, message: string, errors?: string[]): Response;
export declare function unauthorized(res: Response, message: string): Response;
export declare function forbidden(res: Response, message: string): Response;
export declare function notFound(res: Response, message: string): Response;
export declare function serverError(res: Response, message?: string): Response;
export declare function conflict(res: Response, message: string): Response;
//# sourceMappingURL=response.d.ts.map