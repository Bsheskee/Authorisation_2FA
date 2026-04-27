import { Request, Response } from 'express';
import db from '../db/database';
import { hashPassword, verifyPassword } from '../services/password.service';
import { generateFullToken, generateTempToken } from '../services/jwt.service';
import { generateSecret, generateQrCode, verifyCode } from '../services/totp.service';
import { validateEmail, validatePassword } from '../utils/validators';
import { logAuditEvent } from '../middleware/auditLogger';

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  totp_secret: string | null;
  is_2fa_enabled: number;
  failed_attempts: number;
  locked_until: string | null;
  created_at: string;
  updated_at: string;
}

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  if (!validateEmail(email)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }

  const pwValidation = validatePassword(password);
  if (!pwValidation.valid) {
    res.status(400).json({ error: 'Password too weak', details: pwValidation.errors });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'Email already exists' });
    return;
  }

  const passwordHash = await hashPassword(password);
  const result = db
    .prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
    .run(email, passwordHash);

  logAuditEvent(result.lastInsertRowid as number, 'REGISTER', req);

  res.status(201).json({ message: 'Account created successfully' });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  if (user.locked_until) {
    const lockedUntil = new Date(user.locked_until);
    if (lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
      res.status(423).json({
        error: `Account locked. Try again in ${minutesLeft} minute(s)`,
        lockedUntil: user.locked_until,
      });
      return;
    } else {
      db.prepare('UPDATE users SET locked_until = NULL, failed_attempts = 0 WHERE id = ?').run(user.id);
    }
  }

  const passwordValid = await verifyPassword(password, user.password_hash);
  if (!passwordValid) {
    const newAttempts = user.failed_attempts + 1;
    if (newAttempts >= 5) {
      const lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      db.prepare(
        'UPDATE users SET failed_attempts = ?, locked_until = ?, updated_at = datetime(\'now\') WHERE id = ?'
      ).run(newAttempts, lockUntil, user.id);
    } else {
      db.prepare(
        'UPDATE users SET failed_attempts = ?, updated_at = datetime(\'now\') WHERE id = ?'
      ).run(newAttempts, user.id);
    }
    logAuditEvent(user.id, 'LOGIN_FAIL', req, { attempts: newAttempts });
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  db.prepare(
    'UPDATE users SET failed_attempts = 0, locked_until = NULL, updated_at = datetime(\'now\') WHERE id = ?'
  ).run(user.id);

  if (!user.is_2fa_enabled) {
    const token = generateFullToken(user.id, user.email);
    logAuditEvent(user.id, 'LOGIN_SUCCESS', req);
    res.json({ token, requires2FA: false });
  } else {
    const tempToken = generateTempToken(user.id, user.email);
    logAuditEvent(user.id, 'LOGIN_SUCCESS', req, { step: 'password_verified' });
    res.json({ tempToken, requires2FA: true });
  }
}

export async function setupTotp(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const userEmail = req.user!.email;

  const { secret, otpauthUrl } = generateSecret(userEmail);

  db.prepare(
    'UPDATE users SET totp_secret = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).run(secret, userId);

  const qrCode = await generateQrCode(otpauthUrl);

  res.json({ qrCode });
}

export async function confirmTotp(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { code } = req.body;

  if (!code) {
    res.status(400).json({ error: 'TOTP code is required' });
    return;
  }

  const user = db.prepare('SELECT totp_secret FROM users WHERE id = ?').get(userId) as { totp_secret: string | null } | undefined;
  if (!user || !user.totp_secret) {
    res.status(400).json({ error: 'TOTP not set up. Call /setup-totp first' });
    return;
  }

  const valid = verifyCode(user.totp_secret, code);
  if (!valid) {
    res.status(401).json({ error: 'Invalid TOTP code' });
    return;
  }

  db.prepare(
    'UPDATE users SET is_2fa_enabled = 1, updated_at = datetime(\'now\') WHERE id = ?'
  ).run(userId);

  logAuditEvent(userId, '2FA_ENABLED', req);

  res.json({ message: '2FA has been activated successfully' });
}

export async function verifyTotp(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const email = req.user!.email;
  const { code } = req.body;

  if (!code) {
    res.status(400).json({ error: 'TOTP code is required' });
    return;
  }

  const user = db.prepare('SELECT totp_secret FROM users WHERE id = ?').get(userId) as { totp_secret: string | null } | undefined;
  if (!user || !user.totp_secret) {
    res.status(400).json({ error: 'TOTP not configured for this account' });
    return;
  }

  const valid = verifyCode(user.totp_secret, code);
  if (!valid) {
    logAuditEvent(userId, '2FA_FAIL', req);
    res.status(401).json({ error: 'Invalid TOTP code' });
    return;
  }

  const token = generateFullToken(userId, email);
  logAuditEvent(userId, '2FA_SUCCESS', req);
  res.json({ token });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  logAuditEvent(userId, 'LOGOUT', req);
  res.json({ message: 'Logged out successfully' });
}
