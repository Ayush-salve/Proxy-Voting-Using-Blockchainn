import express from 'express';
import {
  register,
  login,
  getMe,
  refreshSession,
  logout,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Public Authentication Endpoints
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshTokenSchema), refreshSession);

// Protected Auth Endpoints
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

export default router;
