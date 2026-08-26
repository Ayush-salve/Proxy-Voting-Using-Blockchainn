import express from 'express';
import {
  listProposals,
  getProposalById,
  createProposal,
  updateProposalStatus,
  createProposalSchema,
  updateProposalStatusSchema,
} from '../controllers/proposalController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.get('/', authenticate, listProposals);
router.get('/:id', authenticate, getProposalById);
router.post('/', authenticate, authorizeRoles(ROLES.COMPANY_ADMIN), validate(createProposalSchema), createProposal);
router.patch('/:id/status', authenticate, authorizeRoles(ROLES.COMPANY_ADMIN), validate(updateProposalStatusSchema), updateProposalStatus);

export default router;
