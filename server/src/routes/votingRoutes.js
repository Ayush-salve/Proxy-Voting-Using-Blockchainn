import express from 'express';
import {
  castDirectVote,
  getMyVotingHistory,
  getVoteReceiptByHash,
  castVoteSchema,
} from '../controllers/votingController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

// Direct voting endpoint (Shareholders only)
router.post('/direct', authenticate, authorizeRoles(ROLES.SHAREHOLDER), validate(castVoteSchema), castDirectVote);

// My voting history
router.get('/history', authenticate, getMyVotingHistory);

// Public cryptographic receipt verification
router.get('/receipt/:txHash', getVoteReceiptByHash);

export default router;
