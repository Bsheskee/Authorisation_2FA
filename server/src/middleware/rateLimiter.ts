import rateLimit from 'express-rate-limit';

export const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts, please try again after 1 minute' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const registerRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { error: 'Too many registration attempts, please try again after 1 minute' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const totpRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { error: 'Too many TOTP attempts, please try again after 1 minute' },
  standardHeaders: true,
  legacyHeaders: false,
});
