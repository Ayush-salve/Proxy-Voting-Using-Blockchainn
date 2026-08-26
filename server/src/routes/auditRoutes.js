import express from 'express';
import { listAuditLogs } from '../controllers/auditController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.get('/', authenticate, authorizeRoles(ROLES.COMPANY_ADMIN, ROLES.AUDITOR), listAuditLogs);

export default router;
