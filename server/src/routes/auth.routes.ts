import { Router } from 'express';
import {
  register,
  login,
  setupTotp,
  confirmTotp,
  verifyTotp,
  logout,
} from '../controllers/auth.controller';
import { verifyJwt, requireFullToken, requireTempToken } from '../middleware/verifyJwt';
import { loginRateLimiter, registerRateLimiter, totpRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', registerRateLimiter, register);
router.post('/login', loginRateLimiter, login);
router.post('/setup-totp', verifyJwt, requireFullToken, setupTotp);
router.post('/confirm-totp', verifyJwt, requireFullToken, confirmTotp);
router.post('/verify-totp', verifyJwt, requireTempToken, totpRateLimiter, verifyTotp);
router.post('/logout', verifyJwt, requireFullToken, logout);

export default router;
