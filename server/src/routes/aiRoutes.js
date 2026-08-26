import express from 'express';
import { summarizeProposal, getProposalSummary } from '../controllers/aiController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/summarize/:proposalId', authenticate, summarizeProposal);
router.get('/summary/:proposalId', getProposalSummary);

export default router;
