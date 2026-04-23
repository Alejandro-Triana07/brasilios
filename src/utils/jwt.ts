import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { JwtPayload } from '../types';

const JWT_SECRET         = process.env.JWT_SECRET          || 'secret';
const JWT_EXPIRES_IN     = process.env.JWT_EXPIRES_IN       || '1h';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET   || 'refresh_secret';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function isAppJwtPayload(value: unknown): value is JwtPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return typeof payload.sub === 'number'
    && typeof payload.jti === 'string'
    && typeof payload.rol === 'string'
    && typeof payload.correo === 'string';
}

interface RefreshJwtPayload {
  sub: number;
  jti: string;
  iat?: number;
  exp?: number;
}

function isRefreshJwtPayload(value: unknown): value is RefreshJwtPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const payload = value as Record<string, unknown>;
  return typeof payload.sub === 'number' && typeof payload.jti === 'string';
}

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
  const decoded = jwt.verify(token, JWT_SECRET);
  if (typeof decoded === 'string' || !isAppJwtPayload(decoded)) {
    throw new Error('Token inválido');
  }
  return decoded;
}

export function verificarRefreshToken(token: string): RefreshJwtPayload {
  const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
  if (typeof decoded === 'string' || !isRefreshJwtPayload(decoded)) {
    throw new Error('Token inválido');
  }
  return decoded;
}

export function decodificarToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || typeof decoded === 'string' || !isAppJwtPayload(decoded)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}
