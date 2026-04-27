import { Request } from 'express';
import db from '../db/database';

export type AuditAction =
  | 'REGISTER'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAIL'
  | '2FA_SUCCESS'
  | '2FA_FAIL'
  | '2FA_ENABLED'
  | 'LOGOUT';

export function logAuditEvent(
  userId: number | null,
  action: AuditAction,
  req: Request,
  details?: object
): void {
  const ip = req.ip || req.socket.remoteAddress || null;
  const userAgent = req.headers['user-agent'] || null;
  const detailsJson = details ? JSON.stringify(details) : null;

  const stmt = db.prepare(
    'INSERT INTO audit_logs (user_id, action, ip_address, user_agent, details) VALUES (?, ?, ?, ?, ?)'
  );
  stmt.run(userId, action, ip, userAgent, detailsJson);
}
