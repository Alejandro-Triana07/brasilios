import { Response } from 'express';
import { ApiResponse } from '../types';

export function ok<T>(res: Response, message: string, data?: T): Response {
  const body: ApiResponse<T> = { success: true, message, data };
  return res.status(200).json(body);
}

export function created<T>(res: Response, message: string, data?: T): Response {
  const body: ApiResponse<T> = { success: true, message, data };
  return res.status(201).json(body);
}

export function badRequest(res: Response, message: string, errors?: string[]): Response {
  const body: ApiResponse = { success: false, message, errors };
  return res.status(400).json(body);
}

export function unauthorized(res: Response, message: string): Response {
  const body: ApiResponse = { success: false, message };
  return res.status(401).json(body);
}

export function forbidden(res: Response, message: string): Response {
  const body: ApiResponse = { success: false, message };
  return res.status(403).json(body);
}

export function notFound(res: Response, message: string): Response {
  const body: ApiResponse = { success: false, message };
  return res.status(404).json(body);
}

export function serverError(res: Response, message = 'Error interno del servidor'): Response {
  const body: ApiResponse = { success: false, message };
  return res.status(500).json(body);
  
}

export function conflict(res: Response, message: string): Response {
  const body: ApiResponse = { success: false, message };
  return res.status(409).json(body);
}