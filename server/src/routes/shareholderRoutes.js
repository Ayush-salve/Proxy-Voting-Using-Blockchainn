import express from 'express';
import {
  listShareholders,
  createShareholder,
  getShareholderById,
  updateShareholder,
  getMyPortfolio,
  createShareholderSchema,
  updateShareholderSchema,
} from '../controllers/shareholderController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

// Shareholder Self Portfolio View
router.get('/me/portfolio', authenticate, authorizeRoles(ROLES.SHAREHOLDER), getMyPortfolio);

// Admin & Auditor list view
router.get('/', authenticate, authorizeRoles(ROLES.COMPANY_ADMIN, ROLES.AUDITOR), listShareholders);

// Admin Create Shareholder
router.post(
  '/',
  authenticate,
  authorizeRoles(ROLES.COMPANY_ADMIN),
  validate(createShareholderSchema),
  createShareholder
);

// Admin & Auditor / Owner Details View
router.get('/:id', authenticate, getShareholderById);

// Admin Update Shareholder
router.patch(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.COMPANY_ADMIN),
  validate(updateShareholderSchema),
  updateShareholder
);

export default router;
