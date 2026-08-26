import express from 'express';
import { listAnomalies, resolveAnomaly } from '../controllers/anomalyController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.get('/', authenticate, authorizeRoles(ROLES.COMPANY_ADMIN, ROLES.AUDITOR), listAnomalies);
router.patch('/:id/resolve', authenticate, authorizeRoles(ROLES.COMPANY_ADMIN), resolveAnomaly);

export default router;
