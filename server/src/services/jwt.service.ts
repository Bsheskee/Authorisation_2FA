import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const TEMP_TOKEN_EXPIRES_IN = process.env.TEMP_TOKEN_EXPIRES_IN || '5m';

export interface TokenPayload {
  userId: number;
  email: string;
  type: 'full' | 'temp';
}

export function generateFullToken(userId: number, email: string): string {
  const payload: TokenPayload = { userId, email, type: 'full' };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function generateTempToken(userId: number, email: string): string {
  const payload: TokenPayload = { userId, email, type: 'temp' };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TEMP_TOKEN_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return payload;
  } catch {
    return null;
  }
}
