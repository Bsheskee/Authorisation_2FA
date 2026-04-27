interface JwtPayload {
  userId: number;
  email: string;
  type: 'full' | 'temp';
  exp: number;
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1])) as JwtPayload;
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    if (payload.type === 'temp') return null;
    return payload;
  } catch {
    return null;
  }
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1])) as JwtPayload;
  } catch {
    return null;
  }
}
