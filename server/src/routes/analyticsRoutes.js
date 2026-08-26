import express from 'express';
import { getDashboardAnalytics } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.get('/dashboard', authenticate, authorizeRoles(ROLES.COMPANY_ADMIN, ROLES.AUDITOR), getDashboardAnalytics);

export default router;
