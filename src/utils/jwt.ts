import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { JwtPayload } from '../types';

const JWT_SECRET         = process.env.JWT_SECRET          || 'secret';
const JWT_EXPIRES_IN     = process.env.JWT_EXPIRES_IN       || '1h';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET   || 'refresh_secret';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export function generarAccessToken(payload: Omit<JwtPayload, 'jti' | 'iat' | 'exp'>): string {
  const jti = uuidv4();
  return jwt.sign({ ...payload, jti }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function generarRefreshToken(usuarioId: number): string {
  return jwt.sign({ sub: usuarioId, jti: uuidv4() }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verificarAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function verificarRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
}

export function decodificarToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}
