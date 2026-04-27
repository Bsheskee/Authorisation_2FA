import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../services/jwt.service';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function verifyJwt(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    return;
  }

  req.user = payload;
  next();
}

export function requireFullToken(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.type === 'temp') {
    res.status(403).json({ error: 'Forbidden: Full authentication required' });
    return;
  }
  next();
}

export function requireTempToken(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.type !== 'temp') {
    res.status(403).json({ error: 'Forbidden: Temporary token required' });
    return;
  }
  next();
}
