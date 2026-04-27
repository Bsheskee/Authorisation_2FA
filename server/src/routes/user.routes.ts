import { Router, Request, Response } from 'express';
import db from '../db/database';
import { verifyJwt, requireFullToken } from '../middleware/verifyJwt';

const router = Router();

router.get('/dashboard', verifyJwt, requireFullToken, (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const user = db
    .prepare('SELECT id, email, is_2fa_enabled, created_at FROM users WHERE id = ?')
    .get(userId) as { id: number; email: string; is_2fa_enabled: number; created_at: string } | undefined;

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    id: user.id,
    email: user.email,
    is2faEnabled: Boolean(user.is_2fa_enabled),
    createdAt: user.created_at,
  });
});

router.get('/audit-log', verifyJwt, requireFullToken, (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const logs = db
    .prepare(
      'SELECT action, ip_address, user_agent, details, created_at FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
    )
    .all(userId) as Array<{
    action: string;
    ip_address: string | null;
    user_agent: string | null;
    details: string | null;
    created_at: string;
  }>;

  res.json({
    logs: logs.map((log) => ({
      action: log.action,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      details: log.details ? JSON.parse(log.details) : null,
      createdAt: log.created_at,
    })),
  });
});

export default router;
